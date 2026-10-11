import { parsePartialJson, type JsonValue, type PartialParse } from "../json/parse.js";

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
  #text = "";
  #parsed: PartialParse = parsePartialJson("");
  #done = false;
  #version = 0;
  #changed = signal();

  constructor(chunks: AsyncIterable<string>) {
    void this.#read(chunks);
  }

  async #read(chunks: AsyncIterable<string>) {
    try {
      for await (const chunk of chunks) {
        this.#text += chunk;
        this.#parsed = parsePartialJson(this.#text);
        this.#notify();
      }
    } catch {
      // A broken stream ends the response; what arrived still renders.
    } finally {
      this.#parsed = parsePartialJson(this.#text, { final: true });
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
  get parsed(): PartialParse {
    return this.#parsed;
  }

  /** Whether the model has finished writing. */
  get done(): boolean {
    return this.#done;
  }

  /** Increases with every chunk; lets callers cache work per state of the response. */
  get version(): number {
    return this.#version;
  }

  /** The value at a JSON Pointer, as written so far. */
  valueAt(pointer: string): JsonValue | undefined {
    let value: JsonValue | undefined = this.#parsed.value;
    if (pointer === "") return value;
    for (const raw of pointer.slice(1).split("/")) {
      const key = raw.replaceAll("~1", "/").replaceAll("~0", "~");
      if (Array.isArray(value)) value = value[Number(key)];
      else if (typeof value === "object" && value !== null && Object.hasOwn(value, key)) {
        value = value[key];
      } else return undefined;
    }
    return value;
  }

  /** Whether the value at a pointer may still grow. */
  isOpen(pointer: string): boolean {
    return !this.#done && this.#parsed.open.has(pointer);
  }

  /** Resolves once `ready()` holds or the response is finished. */
  async until(ready: () => boolean): Promise<void> {
    while (!ready() && !this.#done) await this.#changed.promise;
  }
}

/** A model response that server components can wait on while it streams. */
export type ResponseStream = StreamedResponse;

/** Starts reading a model response; the returned stream fills in as chunks arrive. */
export function readResponse(chunks: AsyncIterable<string>): ResponseStream {
  return new StreamedResponse(chunks);
}
