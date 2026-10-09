import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { Messages } from "../messages/Messages.js";
import { useBusy } from "../internal/busy.js";
import { Message, MessageAuthor, MessageContent, MessageTime } from "./Message.js";

function BusyProbe() {
  return <output>{useBusy() ? "busy" : "idle"}</output>;
}

describe("message composition", () => {
  it("renders an article with author, time and content parts", () => {
    const { container } = setup(
      <Messages aria-label="Chat">
        <Message from="assistant">
          <MessageAuthor>Assistant</MessageAuthor>
          <MessageTime dateTime="2026-10-09T10:00:00Z">10:00</MessageTime>
          <MessageContent>Hello</MessageContent>
        </Message>
      </Messages>,
    );
    const message = container.querySelector("article")!;

    expect(message.getAttribute("data-from")).toBe("assistant");
    expect(message.getAttribute("data-status")).toBe("complete");
    expect(message.hasAttribute("aria-busy")).toBe(false);
    expect(message.querySelector("time")?.getAttribute("datetime")).toBe("2026-10-09T10:00:00Z");
    expect(message.querySelector("[data-slot='message-content']")?.textContent).toBe("Hello");
  });

  it("is busy for its content only while streaming", () => {
    const { container, rerender } = setup(
      <Message status="streaming">
        <BusyProbe />
      </Message>,
    );
    const message = container.querySelector("article")!;

    expect(message.getAttribute("aria-busy")).toBe("true");
    expect(message.hasAttribute("data-busy")).toBe(true);
    expect(container.querySelector("output")?.textContent).toBe("busy");

    rerender(
      <Message status="complete">
        <BusyProbe />
      </Message>,
    );
    expect(message.hasAttribute("aria-busy")).toBe(false);
    expect(container.querySelector("output")?.textContent).toBe("idle");
  });

  it("reports an error status without busy state", () => {
    const { container } = setup(<Message status="error">Failed</Message>);
    const message = container.querySelector("article")!;
    expect(message.getAttribute("data-status")).toBe("error");
    expect(message.hasAttribute("aria-busy")).toBe(false);
  });

  it("inherits busy state from an enclosing Messages log", () => {
    const { container } = setup(
      <Messages aria-label="Chat" busy>
        <Message>
          <BusyProbe />
        </Message>
      </Messages>,
    );
    expect(container.querySelector("output")?.textContent).toBe("busy");
  });
});
