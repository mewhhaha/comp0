import { type JsonValue } from "../json/parse.js";
import { isJson, type ToolCaller, type ToolResult } from "../tools/tools.js";

/*
 * MCP Apps (the `io.modelcontextprotocol/ui` extension) shows a tool's `ui://` resource in a
 * sandboxed frame that talks JSON-RPC 2.0 with the host over `postMessage`. This is the app's end
 * of that channel: the `ui/initialize` handshake, requests with timeouts, and the host's
 * notifications, chiefly the tool arguments it streams while the model writes them.
 *
 * Sandboxed frames cannot know their parent's origin (web hosts add a proxy frame on an origin of
 * their own), so messages are posted to `"*"` and trust rests on `event.source` being the parent.
 * Nothing the bridge posts is secret: the host is the only party that can answer it.
 */

/** The MCP Apps protocol version the bridge speaks. */
export const mcpAppProtocolVersion = "2026-01-26";

/** How a host can show the app. */
export type McpDisplayMode = "inline" | "fullscreen" | "pip";

/** A name and version, as `appInfo` and `hostInfo` carry them. */
export type McpImplementation = { name: string; version: string };

/** An MCP content block, such as `{ type: "text", text }`. */
export type McpContentBlock = { readonly type: string; readonly [field: string]: unknown };

/** Where and how the host shows the app. Fields the host adds beyond these are kept as sent. */
export type McpHostContext = {
  theme?: "light" | "dark" | undefined;
  /** CSS variables and font CSS the host offers so the app can match it. */
  styles?:
    | {
        variables?: Readonly<Record<string, string | undefined>> | undefined;
        css?: { fonts?: string | undefined } | undefined;
      }
    | undefined;
  displayMode?: McpDisplayMode | undefined;
  availableDisplayModes?: readonly string[] | undefined;
  /** A fixed `height`/`width` fills the frame; a `maxHeight`/`maxWidth` lets the app size it. */
  containerDimensions?:
    | { height?: number; maxHeight?: number; width?: number; maxWidth?: number }
    | undefined;
  locale?: string | undefined;
  timeZone?: string | undefined;
  platform?: "web" | "desktop" | "mobile" | undefined;
  readonly [field: string]: unknown;
};

/** What the host answered to `ui/initialize`. */
export type McpInitializeResult = {
  protocolVersion: string;
  hostInfo?: McpImplementation | undefined;
  /** What the host supports, such as `serverTools` (it proxies `tools/call`) or `openLinks`. */
  hostCapabilities: Readonly<Record<string, unknown>>;
  hostContext: McpHostContext;
};

/** The arguments of the tool call the app was opened for, as the host streams them. */
export type McpToolInput = {
  /** The arguments so far: a best-effort object until `final`, `undefined` before any arrive. */
  arguments: Readonly<Record<string, unknown>> | undefined;
  /** The host sent the complete arguments. */
  final: boolean;
  /** The host cancelled the tool call. `arguments` keeps whatever arrived before. */
  cancelled: boolean;
  /** Why the host cancelled, when it said. */
  reason?: string | undefined;
};

/** Context the model reads on its next turn. Each update replaces the previous one. */
export type McpModelContext = {
  content?: readonly McpContentBlock[] | undefined;
  structuredContent?: Readonly<Record<string, unknown>> | undefined;
};

/** The app's size in pixels, for hosts that fit the frame to it. */
export type McpAppSize = { width?: number | undefined; height?: number | undefined };

/** A request the host refused or never answered. `code` is the JSON-RPC error code. */
export type McpAppError = Error & { code: number };

/** The frame the app runs in, as far as the bridge needs it: where the host's messages arrive. */
export type McpAppFrame = {
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
};

/** The host's frame, as far as the bridge needs it: where the app's messages go. */
export type McpHostFrame = { postMessage(message: unknown, targetOrigin: string): void };

export type McpAppBridgeOptions = {
  /** Sent to the host as `appInfo`. */
  appInfo?: McpImplementation | undefined;
  /** The display modes the app supports, declared to the host. None are declared by default. */
  displayModes?: readonly McpDisplayMode[] | undefined;
  /** How long to wait for the host to answer a request, in milliseconds. Defaults to a minute. */
  timeout?: number | undefined;
  /**
   * Reports the document's size whenever it changes, so a host that fits its frame to the app
   * can. Uses `ResizeObserver` on the current document; defaults to true.
   */
  autoResize?: boolean | undefined;
  /** Runs when the host is about to remove the app; the host waits for it to settle. */
  onTeardown?: ((reason: string | undefined) => void | Promise<void>) | undefined;
  /**
   * The host frame's origin, when the app knows it. Messages are then posted only to it and read
   * only from it. Defaults to `"*"`, with messages read only from the parent frame.
   */
  targetOrigin?: string | undefined;
  /** The app's own window, where the host's messages arrive. Defaults to `window`. */
  window?: McpAppFrame | undefined;
  /** The host's window. Defaults to `window.parent`. */
  parent?: McpHostFrame | undefined;
};

/** The app's connection to its MCP Apps host. Every member can be passed around on its own. */
export type McpAppBridge = {
  /** Settles once the handshake is done, with what the host said about itself. */
  ready: Promise<McpInitializeResult>;
  /**
   * Calls a tool on the MCP server through the host (`tools/call`). Prefers the result's
   * `structuredContent`, then its text content (parsed when it is JSON). Errors never carry the
   * server's or the host's details, which may not be safe to show.
   */
  call: ToolCaller;
  /** Sends the person's next message (`ui/message`). Resolves to whether the host accepted it. */
  sendMessage: (text: string) => Promise<boolean>;
  /** Replaces what the model reads on its next turn (`ui/update-model-context`). */
  updateModelContext: (context: McpModelContext) => Promise<boolean>;
  /** The tool arguments so far; the same object until the host sends more. */
  getToolInput: () => McpToolInput;
  /** Calls `listener` whenever the tool arguments change. Returns the unsubscribe function. */
  onToolInput: (listener: (input: McpToolInput) => void) => () => void;
  /** The host context: what the handshake reported, merged with every change since. */
  getHostContext: () => McpHostContext;
  /** Calls `listener` whenever the host context changes. Returns the unsubscribe function. */
  onHostContext: (listener: (context: McpHostContext) => void) => () => void;
  /** Tells the host the app's size (`ui/notifications/size-changed`). */
  notifySize: (size: McpAppSize) => void;
  /**
   * Sends any request once the handshake is done, such as `ui/open-link` or
   * `ui/request-display-mode`. Rejects with an {@link McpAppError} when the host refuses or does
   * not answer in time.
   */
  request: (method: string, params?: Readonly<Record<string, unknown>>) => Promise<unknown>;
  /** Calls `listener` with the params of every host notification named `method`. */
  onNotification: (method: string, listener: (params: unknown) => void) => () => void;
  /** Stops listening, fails pending requests, and stops reporting the size. */
  close: () => void;
};

/** JSON-RPC and MCP error codes the bridge reports. */
const connectionClosed = -32000;
const requestTimeout = -32001;
const methodNotFound = -32601;

const defaultAppInfo: McpImplementation = { name: "@comp0/genui", version: "0.0.0" };

type Pending = {
  resolve: (result: unknown) => void;
  reject: (error: McpAppError) => void;
  timer: ReturnType<typeof setTimeout>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(message: string, code: number): McpAppError {
  return Object.assign(new Error(message), { code });
}

function reasonOf(params: unknown): string | undefined {
  return isRecord(params) && typeof params.reason === "string" ? params.reason : undefined;
}

function initializeResult(result: unknown): McpInitializeResult {
  const value = isRecord(result) ? result : {};
  const hostInfo = isRecord(value.hostInfo) ? (value.hostInfo as McpImplementation) : undefined;
  return {
    protocolVersion:
      typeof value.protocolVersion === "string" ? value.protocolVersion : mcpAppProtocolVersion,
    hostInfo,
    hostCapabilities: isRecord(value.hostCapabilities) ? value.hostCapabilities : {},
    hostContext: isRecord(value.hostContext) ? value.hostContext : {},
  };
}

/** A tool's text content, read as JSON when it is JSON. */
function textValue(content: unknown): JsonValue {
  const blocks = Array.isArray(content) ? (content as unknown[]) : [];
  const texts: string[] = [];
  for (const block of blocks) {
    if (isRecord(block) && block.type === "text" && typeof block.text === "string") {
      texts.push(block.text);
    }
  }
  if (texts.length === 0) return null;
  const text = texts.join("\n");
  try {
    const value: unknown = JSON.parse(text);
    return isJson(value) ? value : text;
  } catch {
    return text;
  }
}

/** Reads a `CallToolResult` the way the interface stores tool results. */
function toolResult(name: string, result: unknown): ToolResult {
  if (!isRecord(result)) return { ok: false, error: `${name} answered with something unexpected` };
  // The error text is written for the model and may hold the server's details.
  if (result.isError === true) return { ok: false, error: `${name} failed` };
  const structured = result.structuredContent;
  if (isRecord(structured) && isJson(structured)) return { ok: true, value: structured };
  return { ok: true, value: textValue(result.content) };
}

/**
 * Measures the document as a host that fits its frame to the app needs it: the content's own
 * height (`max-content`, so it can shrink below the frame) and the frame's width.
 */
function observeSize(report: (size: McpAppSize) => void): () => void {
  if (typeof ResizeObserver === "undefined" || typeof document === "undefined") return () => {};
  const root = document.documentElement;
  let last = "";
  let frame = 0;
  const measure = () => {
    frame = 0;
    const height = root.style.height;
    root.style.height = "max-content";
    const size = {
      width: Math.ceil(window.innerWidth),
      height: Math.ceil(root.getBoundingClientRect().height),
    };
    root.style.height = height;
    // Reporting an unchanged size would only feed the observer the frame resize it causes.
    const key = `${size.width}x${size.height}`;
    if (key === last) return;
    last = key;
    report(size);
  };
  const schedule = () => {
    if (frame === 0) frame = requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(root);
  if (document.body !== null) observer.observe(document.body);
  schedule();
  return () => {
    observer.disconnect();
    if (frame !== 0) cancelAnimationFrame(frame);
  };
}

/**
 * Connects an MCP Apps view to its host. Call it once, in the app's frame: it starts the
 * `ui/initialize` handshake right away and keeps the latest tool arguments and host context, so
 * nothing the host sends before the interface renders is lost.
 */
export function createMcpAppBridge(options: McpAppBridgeOptions = {}): McpAppBridge {
  if (options.window === undefined && typeof window === "undefined") {
    throw new Error("createMcpAppBridge runs in the app's frame; pass `window` and `parent`.");
  }
  const frame: McpAppFrame = options.window ?? window;
  const host: McpHostFrame = options.parent ?? window.parent;
  const targetOrigin = options.targetOrigin ?? "*";
  const timeout = options.timeout ?? 60_000;
  // Outside a frame the parent is the page itself, which would read its own requests back.
  const standalone = (host as unknown) === frame;

  const pending = new Map<number, Pending>();
  const notificationListeners = new Map<string, Set<(params: unknown) => void>>();
  const inputListeners = new Set<(input: McpToolInput) => void>();
  const contextListeners = new Set<(context: McpHostContext) => void>();
  let toolInput: McpToolInput = { arguments: undefined, final: false, cancelled: false };
  let hostContext: McpHostContext = {};
  let nextId = 1;
  let closed = false;
  let stopResizing = () => {};

  function post(message: Record<string, unknown>) {
    host.postMessage({ jsonrpc: "2.0", ...message }, targetOrigin);
  }

  function notify(method: string, params?: Readonly<Record<string, unknown>>) {
    if (closed || standalone) return;
    post(params === undefined ? { method } : { method, params });
  }

  function send(method: string, params: unknown): Promise<unknown> {
    if (standalone) return Promise.reject(failure("There is no MCP Apps host.", connectionClosed));
    if (closed) return Promise.reject(failure("The bridge is closed.", connectionClosed));
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(failure(`The host did not answer ${method} in time.`, requestTimeout));
      }, timeout);
      pending.set(id, { resolve, reject, timer });
      try {
        post({ id, method, params });
      } catch {
        // postMessage throws for values it cannot clone.
        clearTimeout(timer);
        pending.delete(id);
        reject(failure(`${method} could not be sent.`, connectionClosed));
      }
    });
  }

  function setToolInput(next: McpToolInput) {
    toolInput = next;
    for (const listener of [...inputListeners]) listener(next);
  }

  function setHostContext(next: McpHostContext) {
    hostContext = next;
    for (const listener of [...contextListeners]) listener(next);
  }

  function dispatch(method: string, params: unknown) {
    if (
      method === "ui/notifications/tool-input-partial" ||
      method === "ui/notifications/tool-input"
    ) {
      const args = isRecord(params) && isRecord(params.arguments) ? params.arguments : undefined;
      setToolInput({
        arguments: args ?? toolInput.arguments,
        final: method === "ui/notifications/tool-input",
        cancelled: false,
      });
    } else if (method === "ui/notifications/tool-cancelled") {
      setToolInput({ ...toolInput, cancelled: true, reason: reasonOf(params) });
    } else if (method === "ui/notifications/host-context-changed" && isRecord(params)) {
      // The host sends only the fields that changed.
      setHostContext({ ...hostContext, ...params });
    }
    for (const listener of [...(notificationListeners.get(method) ?? [])]) listener(params);
  }

  async function answer(id: string | number, method: string, params: unknown) {
    if (method === "ping") {
      post({ id, result: {} });
    } else if (method === "ui/resource-teardown") {
      try {
        await options.onTeardown?.(reasonOf(params));
        post({ id, result: {} });
      } catch {
        post({ id, error: { code: connectionClosed, message: "Teardown error" } });
      }
    } else {
      post({ id, error: { code: methodNotFound, message: "Method not found" } });
    }
  }

  function receive(event: MessageEvent) {
    if ((event.source as unknown) !== host) return;
    if (targetOrigin !== "*" && event.origin !== targetOrigin) return;
    const message: unknown = event.data;
    if (!isRecord(message) || message.jsonrpc !== "2.0") return;
    const { id, method } = message;
    if (typeof method === "string") {
      if (typeof id === "string" || typeof id === "number") void answer(id, method, message.params);
      else dispatch(method, message.params);
      return;
    }
    if (typeof id !== "number") return;
    const entry = pending.get(id);
    if (entry === undefined) return;
    pending.delete(id);
    clearTimeout(entry.timer);
    const error = message.error;
    if (!isRecord(error)) {
      entry.resolve(message.result);
      return;
    }
    const text = typeof error.message === "string" ? error.message : "The host refused.";
    entry.reject(failure(text, typeof error.code === "number" ? error.code : connectionClosed));
  }

  if (!standalone) frame.addEventListener("message", receive);

  const appCapabilities =
    options.displayModes === undefined ? {} : { availableDisplayModes: [...options.displayModes] };
  const ready = send("ui/initialize", {
    appInfo: options.appInfo ?? defaultAppInfo,
    appCapabilities,
    protocolVersion: mcpAppProtocolVersion,
  }).then((result) => {
    if (closed) throw failure("The bridge is closed.", connectionClosed);
    const initialized = initializeResult(result);
    setHostContext(initialized.hostContext);
    notify("ui/notifications/initialized");
    if (options.autoResize !== false) {
      stopResizing = observeSize((size) => notify("ui/notifications/size-changed", size));
    }
    return initialized;
  });
  // A host that never answers fails `ready` and every request after it; nobody must await it.
  ready.catch(() => {});

  const request = (method: string, params?: Readonly<Record<string, unknown>>) =>
    ready.then(() => send(method, params));

  function accepted(reply: Promise<unknown>): Promise<boolean> {
    return reply.then(
      (result) => !(isRecord(result) && result.isError === true),
      () => false,
    );
  }

  return {
    ready,
    call: async (name, args) => {
      if (!isRecord(args)) return { ok: false, error: `${name} takes its arguments as an object` };
      let result: unknown;
      try {
        result = await request("tools/call", { name, arguments: args });
      } catch (error) {
        if ((error as Partial<McpAppError>).code === requestTimeout) {
          return { ok: false, error: `${name} took too long to answer` };
        }
        return { ok: false, error: `${name} could not be reached` };
      }
      return toolResult(name, result);
    },
    sendMessage: (text) => {
      if (text.trim() === "") return Promise.resolve(false);
      const content = [{ type: "text", text }];
      return accepted(request("ui/message", { role: "user", content }));
    },
    updateModelContext: (context) => accepted(request("ui/update-model-context", context)),
    getToolInput: () => toolInput,
    onToolInput: (listener) => {
      inputListeners.add(listener);
      return () => void inputListeners.delete(listener);
    },
    getHostContext: () => hostContext,
    onHostContext: (listener) => {
      contextListeners.add(listener);
      return () => void contextListeners.delete(listener);
    },
    notifySize: (size) => {
      void ready.then(
        () => notify("ui/notifications/size-changed", size),
        () => {},
      );
    },
    request,
    onNotification: (method, listener) => {
      const listeners = notificationListeners.get(method) ?? new Set();
      notificationListeners.set(method, listeners);
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    close: () => {
      if (closed) return;
      closed = true;
      if (!standalone) frame.removeEventListener("message", receive);
      stopResizing();
      for (const entry of pending.values()) {
        clearTimeout(entry.timer);
        entry.reject(failure("The bridge is closed.", connectionClosed));
      }
      pending.clear();
    },
  };
}
