import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { useBusy } from "../internal/busy.js";
import { Reasoning, ReasoningContent, ReasoningSummary } from "./index.js";

function BusyProbe() {
  return <output>{useBusy() ? "busy" : "idle"}</output>;
}

describe("reasoning composition", () => {
  it("is a collapsed native details that toggles from its summary", async () => {
    const onOpenChange = vi.fn();
    const { container, getByText, user } = setup(
      <Reasoning onOpenChange={onOpenChange}>
        <ReasoningSummary>Thought for 4 seconds</ReasoningSummary>
        <ReasoningContent>Checked the totals.</ReasoningContent>
      </Reasoning>,
    );
    const details = container.querySelector("details")!;
    const summary = getByText("Thought for 4 seconds");

    expect(details.open).toBe(false);
    expect(summary.getAttribute("aria-expanded")).toBe("false");

    await user.click(summary);
    expect(details.open).toBe(true);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("is busy while thinking and never opens itself", () => {
    const { container, rerender } = setup(
      <Reasoning busy>
        <ReasoningSummary>Thinking…</ReasoningSummary>
        <ReasoningContent>
          <BusyProbe />
        </ReasoningContent>
      </Reasoning>,
    );
    const details = container.querySelector("details")!;

    expect(details.getAttribute("aria-busy")).toBe("true");
    expect(details.hasAttribute("data-busy")).toBe(true);
    expect(details.open).toBe(false);
    expect(container.querySelector("output")?.textContent).toBe("busy");

    rerender(
      <Reasoning>
        <ReasoningSummary>Thought for 4 seconds</ReasoningSummary>
        <ReasoningContent>
          <BusyProbe />
        </ReasoningContent>
      </Reasoning>,
    );
    expect(details.hasAttribute("aria-busy")).toBe(false);
    expect(container.querySelector("output")?.textContent).toBe("idle");
  });
});
