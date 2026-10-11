import { afterEach, describe, expect, it, vi } from "vitest";
import { createMcpAppBridge, type McpAppBridge, type McpAppBridgeOptions } from "./bridge.js";
import { createFakeHost, hostOrigin, messageText, unanswered } from "../../test/mcp-host.js";

const bridges: McpAppBridge[] = [];

afterEach(() => {
  for (const bridge of bridges.splice(0)) bridge.close();
  vi.useRealTimers();
});

function connect(
  host: ReturnType<typeof createFakeHost>,
  options: Omit<McpAppBridgeOptions, "parent"> = {},
) {
  const bridge = createMcpAppBridge({ parent: host.frame, autoResize: false, ...options });
  bridges.push(bridge);
  return bridge;
}

const toolResults = {
  structured: { content: [{ type: "text", text: "3 flights" }], structuredContent: { count: 3 } },
  json: { content: [{ type: "text", text: '[{"id": 1}]' }] },
  text: {
    content: [
      { type: "text", text: "Sunny" },
      { type: "image", data: "", mimeType: "" },
    ],
  },
  parts: {
    content: [
      { type: "text", text: "Sunny" },
      { type: "text", text: "Warm" },
    ],
  },
  empty: { content: [] },
  failed: {
    content: [{ type: "text", text: "Stack trace: secret at db.internal" }],
    isError: true,
  },
} as const;

function toolHost() {
  return createFakeHost({
    handlers: {
      "tools/call": (params) => {
        const name = params.name as keyof typeof toolResults | "refused" | "slow";
        if (name === "refused") throw new Error("Tool refused: visibility excludes app (secret)");
        if (name === "slow") return unanswered();
        return toolResults[name];
      },
    },
  });
}

describe("handshake", () => {
  it("initializes, then tells the host it is ready", async () => {
    const host = createFakeHost();
    const bridge = connect(host, {
      appInfo: { name: "Trips", version: "2.0.0" },
      displayModes: ["inline", "fullscreen"],
    });

    const result = await bridge.ready;

    const [initialize] = host.requests("ui/initialize");
    expect(initialize?.params).toEqual({
      appInfo: { name: "Trips", version: "2.0.0" },
      appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
      protocolVersion: "2026-01-26",
    });
    expect(result.hostInfo).toEqual({ name: "fake-host", version: "1.0.0" });
    expect(result.hostCapabilities).toHaveProperty("serverTools");
    expect(host.posted.map((message) => message.method)).toEqual([
      "ui/initialize",
      "ui/notifications/initialized",
    ]);
    // A sandboxed frame cannot know its parent's origin.
    expect(new Set(host.targetOrigins)).toEqual(new Set(["*"]));
  });

  it("keeps the host context and merges the changes the host sends", async () => {
    const host = createFakeHost();
    const bridge = connect(host);
    const listener = vi.fn();
    bridge.onHostContext(listener);

    await bridge.ready;
    expect(bridge.getHostContext()).toEqual({
      theme: "light",
      displayMode: "inline",
      locale: "en-US",
    });

    host.notify("ui/notifications/host-context-changed", { theme: "dark" });
    expect(bridge.getHostContext()).toEqual({
      theme: "dark",
      displayMode: "inline",
      locale: "en-US",
    });
    expect(listener).toHaveBeenLastCalledWith(bridge.getHostContext());
  });

  it("fails every request when the host never answers", async () => {
    vi.useFakeTimers();
    const host = createFakeHost({ handlers: { "ui/initialize": unanswered } });
    const bridge = connect(host, { timeout: 1000 });
    const call = bridge.call("lookup", {});
    const message = bridge.sendMessage("Hello");

    await vi.advanceTimersByTimeAsync(1000);

    await expect(bridge.ready).rejects.toMatchObject({ code: -32001 });
    await expect(call).resolves.toEqual({ ok: false, error: "lookup took too long to answer" });
    await expect(message).resolves.toBe(false);
    expect(host.notifications("ui/notifications/initialized")).toEqual([]);
  });

  it("does not talk to itself outside a host frame", async () => {
    // jsdom runs the test page at the top, where `window.parent` is `window`.
    const posted = vi.spyOn(window, "postMessage");
    const bridge = createMcpAppBridge({ autoResize: false });
    bridges.push(bridge);

    await expect(bridge.ready).rejects.toThrow("There is no MCP Apps host.");
    await expect(bridge.call("lookup", {})).resolves.toEqual({
      ok: false,
      error: "lookup could not be reached",
    });
    expect(posted).not.toHaveBeenCalled();
  });
});

describe("tool calls", () => {
  it("prefers structured content, then reads text content as JSON or text", async () => {
    const bridge = connect(toolHost());

    await expect(bridge.call("structured", { city: "Oslo" })).resolves.toEqual({
      ok: true,
      value: { count: 3 },
    });
    await expect(bridge.call("json", {})).resolves.toEqual({ ok: true, value: [{ id: 1 }] });
    await expect(bridge.call("text", {})).resolves.toEqual({ ok: true, value: "Sunny" });
    await expect(bridge.call("parts", {})).resolves.toEqual({ ok: true, value: "Sunny\nWarm" });
    await expect(bridge.call("empty", {})).resolves.toEqual({ ok: true, value: null });
  });

  it("sends the name and arguments as tools/call", async () => {
    const host = toolHost();
    const bridge = connect(host);

    await bridge.call("structured", { city: "Oslo" });

    expect(host.requests("tools/call")[0]?.params).toEqual({
      name: "structured",
      arguments: { city: "Oslo" },
    });
  });

  it("reports failures without the server's or the host's details", async () => {
    vi.useFakeTimers();
    const bridge = connect(toolHost(), { timeout: 5000 });
    await bridge.ready;

    await expect(bridge.call("failed", {})).resolves.toEqual({ ok: false, error: "failed failed" });
    await expect(bridge.call("refused", {})).resolves.toEqual({
      ok: false,
      error: "refused could not be reached",
    });
    await expect(bridge.call("structured", ["not", "an", "object"])).resolves.toEqual({
      ok: false,
      error: "structured takes its arguments as an object",
    });

    const slow = bridge.call("slow", {});
    await vi.advanceTimersByTimeAsync(5000);
    await expect(slow).resolves.toEqual({ ok: false, error: "slow took too long to answer" });
  });
});

describe("messages and model context", () => {
  it("sends the person's message as a user text turn", async () => {
    const host = createFakeHost();
    const bridge = connect(host);

    await expect(bridge.sendMessage("Book the 9:40 flight")).resolves.toBe(true);

    const [message] = host.requests("ui/message");
    expect(message?.params).toEqual({
      role: "user",
      content: [{ type: "text", text: "Book the 9:40 flight" }],
    });
    expect(messageText(message!)).toBe("Book the 9:40 flight");
    await expect(bridge.sendMessage("  ")).resolves.toBe(false);
    expect(host.requests("ui/message")).toHaveLength(1);
  });

  it("resolves false when the host refuses a message", async () => {
    const host = createFakeHost({
      handlers: {
        "ui/message": () => {
          throw new Error("Message sending denied");
        },
        "ui/update-model-context": () => ({ isError: true }),
      },
    });
    const bridge = connect(host);

    await expect(bridge.sendMessage("Hi")).resolves.toBe(false);
    await expect(bridge.updateModelContext({ structuredContent: { a: 1 } })).resolves.toBe(false);
  });

  it("replaces the model context with structured content", async () => {
    const host = createFakeHost();
    const bridge = connect(host);

    await expect(bridge.updateModelContext({ structuredContent: { seats: 5 } })).resolves.toBe(
      true,
    );

    expect(host.requests("ui/update-model-context")[0]?.params).toEqual({
      structuredContent: { seats: 5 },
    });
  });
});

describe("tool input", () => {
  it("streams partial arguments and then the final ones", async () => {
    const host = createFakeHost();
    const bridge = connect(host);
    const listener = vi.fn();
    bridge.onToolInput(listener);
    await bridge.ready;

    expect(bridge.getToolInput()).toEqual({ arguments: undefined, final: false, cancelled: false });

    host.notify("ui/notifications/tool-input-partial", { arguments: { type: "Stack" } });
    const partial = bridge.getToolInput();
    expect(partial).toEqual({ arguments: { type: "Stack" }, final: false, cancelled: false });
    expect(bridge.getToolInput()).toBe(partial);

    host.notify("ui/notifications/tool-input", { arguments: { type: "Stack", children: [] } });
    expect(bridge.getToolInput()).toEqual({
      arguments: { type: "Stack", children: [] },
      final: true,
      cancelled: false,
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps what arrived when the host cancels the call", async () => {
    const host = createFakeHost();
    const bridge = connect(host);
    await bridge.ready;

    host.notify("ui/notifications/tool-input-partial", { arguments: { type: "Stack" } });
    host.notify("ui/notifications/tool-cancelled", { reason: "user action" });

    expect(bridge.getToolInput()).toEqual({
      arguments: { type: "Stack" },
      final: false,
      cancelled: true,
      reason: "user action",
    });
  });

  it("hands other host notifications to their listeners", async () => {
    const host = createFakeHost();
    const bridge = connect(host);
    const listener = vi.fn();
    const stop = bridge.onNotification("ui/notifications/tool-result", listener);
    await bridge.ready;

    host.notify("ui/notifications/tool-result", { content: [{ type: "text", text: "Shown." }] });
    stop();
    host.notify("ui/notifications/tool-result", { content: [] });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ content: [{ type: "text", text: "Shown." }] });
  });
});

describe("what the bridge reads", () => {
  it("ignores messages from other frames and anything that is not JSON-RPC", async () => {
    const host = createFakeHost();
    const bridge = connect(host);
    await bridge.ready;
    const input = {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-input",
      params: { arguments: {} },
    };

    host.deliver(input, { source: {} });
    host.deliver({ type: "webpackOk" });
    host.deliver("ui/notifications/tool-input");
    host.deliver({ ...input, jsonrpc: "1.0" });

    expect(bridge.getToolInput().final).toBe(false);
  });

  it("reads only the host's origin and posts only to it when given one", async () => {
    const host = createFakeHost();
    const bridge = connect(host, { targetOrigin: hostOrigin });
    await bridge.ready;

    host.deliver(
      { jsonrpc: "2.0", method: "ui/notifications/tool-input", params: { arguments: {} } },
      { origin: "https://elsewhere.example" },
    );

    expect(bridge.getToolInput().final).toBe(false);
    expect(new Set(host.targetOrigins)).toEqual(new Set([hostOrigin]));
  });

  it("answers pings, teardown, and nothing else", async () => {
    const host = createFakeHost();
    const onTeardown = vi.fn(async () => {});
    connect(host, { onTeardown });

    await expect(host.ask("ping")).resolves.toMatchObject({ result: {} });
    await expect(host.ask("ui/resource-teardown", { reason: "closed" })).resolves.toMatchObject({
      result: {},
    });
    expect(onTeardown).toHaveBeenCalledWith("closed");
    await expect(host.ask("tools/list")).resolves.toMatchObject({ error: { code: -32601 } });
  });

  it("stops reading and fails pending requests once closed", async () => {
    const host = createFakeHost({ handlers: { "ui/open-link": unanswered } });
    const bridge = connect(host);
    await bridge.ready;
    const link = bridge.request("ui/open-link", { url: "https://example.com" });

    bridge.close();
    host.notify("ui/notifications/tool-input", { arguments: {} });

    await expect(link).rejects.toThrow("The bridge is closed.");
    expect(bridge.getToolInput().final).toBe(false);
    await expect(bridge.sendMessage("Hi")).resolves.toBe(false);
  });

  it("reports the app's size once the host is ready", async () => {
    const host = createFakeHost();
    const bridge = connect(host);

    bridge.notifySize({ width: 400, height: 320 });
    await bridge.ready;
    await Promise.resolve();

    expect(host.posted.map((message) => message.method)).toEqual([
      "ui/initialize",
      "ui/notifications/initialized",
      "ui/notifications/size-changed",
    ]);
    expect(host.notifications("ui/notifications/size-changed")[0]?.params).toEqual({
      width: 400,
      height: 320,
    });
  });
});
