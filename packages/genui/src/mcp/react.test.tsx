import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMcpAppBridge, type McpAppBridge } from "./bridge.js";
import { McpAppGenUI, useMcpAppResponse, type McpAppResponse } from "./react.js";
import { createFakeHost, messageText } from "../../test/mcp-host.js";
import { setup } from "../../test/render.js";

const bridges: McpAppBridge[] = [];

afterEach(() => {
  for (const bridge of bridges.splice(0)) bridge.close();
});

async function connect(host: ReturnType<typeof createFakeHost>) {
  const bridge = createMcpAppBridge({ parent: host.frame, autoResize: false });
  bridges.push(bridge);
  await act(() => bridge.ready);
  return bridge;
}

function busyRegion(container: HTMLElement) {
  return container.querySelector("[data-slot='busy-region']");
}

const flights = (title: string, children: unknown[] = []) => ({
  type: "Stack",
  children: [{ type: "Heading", text: title, level: 2 }, ...children],
});

const book = { type: "Button", label: "Book", message: "Book the 9:40 flight" };

describe("McpAppGenUI", () => {
  it("renders the arguments as the model streams them and sends a pressed button", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    const { container, getByRole, user } = setup(<McpAppGenUI bridge={bridge} />);
    expect(busyRegion(container)?.getAttribute("aria-busy")).toBe("true");

    host.notify("ui/notifications/tool-input-partial", { arguments: flights("Fli") });
    const heading = getByRole("heading", { level: 2 });
    expect(heading.textContent).toBe("Fli");

    host.notify("ui/notifications/tool-input-partial", { arguments: flights("Flights", [book]) });
    expect(getByRole("heading", { level: 2 })).toBe(heading);
    expect(heading.textContent).toBe("Flights");
    // Acting on a half-written interface would send a half-written request.
    await user.click(getByRole("button", { name: "Book" }));
    expect(host.requests("ui/message")).toEqual([]);

    host.notify("ui/notifications/tool-input", { arguments: flights("Flights", [book]) });
    expect(busyRegion(container)?.hasAttribute("aria-busy")).toBe(false);
    await user.click(getByRole("button", { name: "Book" }));

    await vi.waitFor(() => expect(host.requests("ui/message")).toHaveLength(1));
    expect(messageText(host.requests("ui/message")[0]!)).toBe("Book the 9:40 flight");
  });

  it("waits for a URL the model is still writing, as it does for streamed text", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    const { getByRole, queryByRole } = setup(<McpAppGenUI bridge={bridge} />);
    const docs = { type: "Link", label: "Docs", href: "https://example.com/docs" };
    const cut = { type: "Link", label: "Status", href: "https://status.exa" };

    host.notify("ui/notifications/tool-input-partial", {
      arguments: { type: "Stack", children: [docs, cut] },
    });
    expect(getByRole("link", { name: "Docs" }).getAttribute("href")).toBe(docs.href);
    expect(queryByRole("link", { name: "Status" })).toBeNull();

    host.notify("ui/notifications/tool-input", {
      arguments: {
        type: "Stack",
        children: [docs, { ...cut, href: "https://status.example.com" }],
      },
    });
    expect(getByRole("link", { name: "Status" }).getAttribute("href")).toBe(
      "https://status.example.com",
    );
  });

  it("shows arguments that arrived before it rendered", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    host.notify("ui/notifications/tool-input", { arguments: flights("Flights") });

    const { getByRole } = setup(<McpAppGenUI bridge={bridge} />);

    expect(getByRole("heading", { level: 2 }).textContent).toBe("Flights");
  });

  it("shares the person's edits as model context", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    const { getByRole, user } = setup(<McpAppGenUI bridge={bridge} />);
    host.notify("ui/notifications/tool-input", {
      arguments: { type: "Stack", children: [{ type: "TextField", label: "Name", name: "name" }] },
    });

    await user.type(getByRole("textbox", { name: "Name" }), "Ada");

    await vi.waitFor(() =>
      expect(host.requests("ui/update-model-context").at(-1)?.params).toEqual({
        structuredContent: { name: "Ada" },
      }),
    );
  });

  it("calls the server's tools through the host", async () => {
    const host = createFakeHost({
      handlers: {
        "tools/call": () => ({ content: [{ type: "text", text: '["9:40", "13:15"]' }] }),
      },
    });
    const bridge = await connect(host);
    const { findAllByRole } = setup(<McpAppGenUI bridge={bridge} />);
    host.notify("ui/notifications/tool-input", {
      arguments: {
        type: "Stack",
        children: [
          { type: "Query", tool: "search_flights", args: { to: "Oslo" }, into: "times" },
          { type: "List", items: { $bind: "times" } },
        ],
      },
    });

    const items = await findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual(["9:40", "13:15"]);
    expect(host.requests("tools/call")[0]?.params).toEqual({
      name: "search_flights",
      arguments: { to: "Oslo" },
    });
  });

  it("withdraws a response whose tool call was cancelled", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    const { container, queryByRole } = setup(<McpAppGenUI bridge={bridge} />);

    host.notify("ui/notifications/tool-input-partial", { arguments: flights("Flights", [book]) });
    host.notify("ui/notifications/tool-cancelled", { reason: "user action" });

    expect(queryByRole("button")).toBeNull();
    expect(busyRegion(container)?.hasAttribute("aria-busy")).toBe(false);
  });

  it("lets props replace the bridge's defaults", async () => {
    const host = createFakeHost();
    const bridge = await connect(host);
    const onAction = vi.fn();
    const { getByRole, user } = setup(<McpAppGenUI bridge={bridge} onAction={onAction} />);
    host.notify("ui/notifications/tool-input", { arguments: flights("Flights", [book]) });

    await user.click(getByRole("button", { name: "Book" }));

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: "button", message: "Book the 9:40 flight" }),
    );
    expect(host.requests("ui/message")).toEqual([]);
  });
});

describe("useMcpAppResponse", () => {
  async function renderProbe() {
    const host = createFakeHost();
    const bridge = await connect(host);
    const seen: McpAppResponse[] = [];
    function Probe() {
      seen.push(useMcpAppResponse(bridge));
      return null;
    }
    setup(<Probe />);
    return { host, latest: () => seen.at(-1) };
  }

  it("reads partial, final, and cancelled tool input", async () => {
    const { host, latest } = await renderProbe();
    expect(latest()).toEqual({ response: undefined, streaming: true, cancelled: false });

    host.notify("ui/notifications/tool-input-partial", { arguments: { type: "Stack" } });
    expect(latest()).toMatchObject({ streaming: true, cancelled: false });

    host.notify("ui/notifications/tool-input", { arguments: { type: "Stack", children: [] } });
    expect(latest()).toEqual({
      response: { type: "Stack", children: [] },
      streaming: false,
      cancelled: false,
    });

    host.notify("ui/notifications/tool-cancelled", {});
    expect(latest()).toMatchObject({ streaming: false, cancelled: true });
  });

  it("marks the last member at every level of partial arguments as still open", async () => {
    const { host, latest } = await renderProbe();
    const args = {
      type: "Stack",
      children: [
        { type: "Text", text: "Done" },
        { type: "Link", label: "Docs", href: "https://exa" },
      ],
    };

    host.notify("ui/notifications/tool-input-partial", { arguments: args });

    expect(latest()?.response).toEqual({
      value: args,
      complete: false,
      open: new Set(["", "/children", "/children/1", "/children/1/href"]),
      issues: [],
    });
  });
});
