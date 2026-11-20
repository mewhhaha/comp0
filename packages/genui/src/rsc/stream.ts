import {
  StreamingJsxParser,
  maxJsxLength,
  parsePartialJsx,
  type JsxNode,
  type JsxParse,
} from "../jsx/parse.js";

function signal() {
  let resolve = () => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

/**
 * A model response read on the server as it streams. Server components wait on it: each node
 * renders once enough of it has arrived, inside its own Suspense boundary, so the interface
 * streams to the browser top-down while the model is still writing.
 */
class StreamedResponse {
  #parser = new StreamingJsxParser();
  #done = false;
  #version = 0;
  #changed = signal();

  constructor(chunks: AsyncIterable<string>) {
    void this.#read(chunks);
  }

  async #read(chunks: AsyncIterable<string>) {
    let failed = false;
    try {
      for await (const chunk of chunks) {
        const revision = this.#parser.revision;
        this.#parser.push(chunk);
        if (revision !== this.#parser.revision) this.#notify();
        if (this.#parser.length > maxJsxLength) break;
      }
    } catch {
      // A broken stream ends the response; what arrived still renders.
      failed = true;
    } finally {
      this.#parser.finish();
      if (failed)
        this.#parser.parsed.errors.push({
          path: "",
          code: "truncated",
          message: "The response stream ended unexpectedly.",
        });
      this.#done = true;
      this.#notify();
    }
  }

  #notify() {
    this.#version += 1;
    const changed = this.#changed;
    this.#changed = signal();
    changed.resolve();
  }

  /** The response parsed so far. */
  get parsed(): JsxParse {
    return this.#parser.parsed;
  }

  /** Bounded source text, retained for validating a complete edit turn. */
  get source(): string {
    return this.#parser.source;
  }

  /** Whether the model has finished writing. */
  get done(): boolean {
    return this.#done;
  }

  /** Increases when nodes change or the stream ends; lets callers cache work per state of the response. */
  get version(): number {
    return this.#version;
  }

  /** A node at its stable tree path. */
  nodeAt(key: string): JsxNode | undefined {
    return this.#parser.byKey.get(key);
  }

  /** Resolves once `ready()` holds or the response is finished. */
  async until(ready: () => boolean): Promise<void> {
    while (!ready() && !this.#done) await this.#changed.promise;
  }
}

/** A model response that server components can wait on while it streams. */
export type ResponseStream = Pick<
  StreamedResponse,
  "source" | "parsed" | "done" | "version" | "nodeAt" | "until"
>;

/** Starts reading a model response; the returned stream fills in as chunks arrive. */
export type ResponseSource = string | AsyncIterable<string>;

export function readResponse(source: ResponseSource): ResponseStream {
  if (typeof source !== "string") return new StreamedResponse(source);
  const text = source.slice(0, maxJsxLength + 1);
  const parsed = parsePartialJsx(text, { final: true });
  return { ...completedResponse(parsed.nodes), source: text, parsed };
}

/** An already validated append keeps its original paths and ancestry without reparsing JSX. */
export function completedResponse(nodes: JsxNode[]): ResponseStream {
  const byKey = new Map<string, JsxNode>();
  function visit(children: JsxNode[]) {
    for (const node of children) {
      byKey.set(node.key, node);
      if (node.kind === "element") visit(node.children);
    }
  }
  visit(nodes);
  return {
    source: "",
    parsed: { nodes, errors: [], complete: true },
    done: true,
    version: 0,
    nodeAt: (key) => byKey.get(key),
    until: async () => {},
  };
}
