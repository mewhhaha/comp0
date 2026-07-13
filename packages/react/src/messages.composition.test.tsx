import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { Messages } from "./components/Messages.js";

describe("messages composition", () => {
  it("renders a named message log without changing its children", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Messages ref={ref} aria-label="Conversation with Ada" aria-live="off">
        <p>Hello</p>
        <button type="button">Reply</button>
      </Messages>,
    );
    const history = container.querySelector<HTMLElement>("[role='log']")!;

    expect(history).toBe(ref.current);
    expect(history.getAttribute("aria-label")).toBe("Conversation with Ada");
    expect(history.getAttribute("aria-live")).toBe("off");
    expect(history.querySelector("p")?.textContent).toBe("Hello");
    expect(history.querySelector("button")?.tabIndex).toBe(0);
  });

  it("marks the log busy only while a message is being assembled", () => {
    const { container, rerender } = render(<Messages aria-label="Conversation" />);
    const history = container.querySelector<HTMLElement>("[role='log']")!;

    expect(history.hasAttribute("aria-busy")).toBe(false);
    expect(history.hasAttribute("data-busy")).toBe(false);

    rerender(<Messages aria-label="Conversation" busy />);
    expect(history.getAttribute("aria-busy")).toBe("true");
    expect(history.hasAttribute("data-busy")).toBe(true);
  });
});
