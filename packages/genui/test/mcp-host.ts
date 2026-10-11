import { act } from "react";
import { type McpHostFrame } from "../src/mcp/bridge.js";

/** A JSON-RPC 2.0 message as it crosses the frame boundary. */
export type JsonRpcMessage = {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
};

/** Answers one request from the app; a thrown error becomes a JSON-RPC error response. */
type Handler = (params: Record<string, unknown>) => unknown;

export type FakeHostOptions = {
  /** The origin the host's messages come from. */
  origin?: string;
  /** Answers by method, over the defaults for `ui/initialize`, `ui/message`, and context updates. */
  handlers?: Record<string, Handler>;
};

export const hostOrigin = "https://host.example";

/** Never settles: the host leaves the request unanswered. */
export const unanswered = () => new Promise<never>(() => {});

/**
 * An MCP Apps host on the other side of `postMessage`: it records what the app posts (cloned, as
 * `postMessage` would), answers requests with its handlers, and sends notifications and requests
 * to the app as `message` events on `window` whose `source` is its frame.
 */
export function createFakeHost(options: FakeHostOptions = {}) {
  const origin = options.origin ?? hostOrigin;
  const posted: JsonRpcMessage[] = [];
  const targetOrigins: string[] = [];
  const replies = new Map<string | number, (message: JsonRpcMessage) => void>();
  const handlers: Record<string, Handler> = {
    "ui/initialize": () => ({
      protocolVersion: "2026-01-26",
      hostInfo: { name: "fake-host", version: "1.0.0" },
      hostCapabilities: { serverTools: {}, openLinks: {} },
      hostContext: { theme: "light", displayMode: "inline", locale: "en-US" },
    }),
    "ui/message": () => ({}),
    "ui/update-model-context": () => ({}),
    ...options.handlers,
  };

  const frame: McpHostFrame = {
    postMessage(message, targetOrigin) {
      const copy = structuredClone(message) as JsonRpcMessage;
      posted.push(copy);
      targetOrigins.push(targetOrigin);
      if (typeof copy.method === "string" && copy.id !== undefined) void answer(copy);
      else if (copy.id !== undefined) replies.get(copy.id)?.(copy);
    },
  };

  async function answer({ id, method, params }: JsonRpcMessage) {
    const handler = handlers[method!];
    if (handler === undefined) {
      deliver({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
      return;
    }
    try {
      deliver({ jsonrpc: "2.0", id, result: await handler(params ?? {}) });
    } catch (error) {
      deliver({ jsonrpc: "2.0", id, error: { code: -32000, message: (error as Error).message } });
    }
  }

  /** Delivers `data` to the app, by default from the host's frame and origin. */
  function deliver(data: unknown, from: { source?: unknown; origin?: string } = {}) {
    const source = (from.source ?? frame) as MessageEventSource;
    window.dispatchEvent(
      new MessageEvent("message", { data, source, origin: from.origin ?? origin }),
    );
  }

  let nextId = 1000;

  return {
    /** Pass as the bridge's `parent`. */
    frame,
    /** Every message the app posted, in order. */
    posted,
    /** The target origin of every post. */
    targetOrigins,
    deliver,
    /** Every request the app sent for `method`. */
    requests: (method: string) =>
      posted.filter((message) => message.method === method && message.id !== undefined),
    /** Every notification the app sent for `method`. */
    notifications: (method: string) =>
      posted.filter((message) => message.method === method && message.id === undefined),
    /** Sends the app a notification, inside `act` so rendered apps settle. */
    notify(method: string, params: Record<string, unknown> = {}) {
      act(() => deliver({ jsonrpc: "2.0", method, params }));
    },
    /** Sends the app a request and resolves with its response. */
    ask(method: string, params: Record<string, unknown> = {}) {
      const id = nextId++;
      return new Promise<JsonRpcMessage>((resolve) => {
        replies.set(id, resolve);
        deliver({ jsonrpc: "2.0", id, method, params });
      });
    },
  };
}

/** The text of a `ui/message` request, as the host would add it to the conversation. */
export function messageText(message: JsonRpcMessage): string {
  const content = message.params?.content as { type: string; text: string }[];
  return content.map((block) => block.text).join("");
}
