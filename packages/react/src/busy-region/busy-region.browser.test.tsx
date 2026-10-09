import { act, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { expectNoAxeViolations } from "../../test/axe.js";
import { BarChart, BarChartPlot, BusyRegion, Button, ChartTable, Status } from "../index.js";

function answer(values: number, busy: boolean): ReactElement {
  return (
    <section aria-label="Answer">
      <BusyRegion busy={busy}>
        <p>Here is the breakdown.</p>
        <BarChart
          values={Array.from({ length: values }, (_, index) => ({
            label: `Item ${index}`,
            value: index + 1,
          }))}
          categoryLabel="Item"
          valueLabel="Count"
        >
          <BarChartPlot aria-label="Items by count" />
          <ChartTable />
        </BarChart>
      </BusyRegion>
      <Status>{busy ? "" : "Answer ready."}</Status>
      <Button>Ask again</Button>
    </section>
  );
}

describe("busy region browser behavior", () => {
  it("has no axe violations while content streams in or after it settles", async () => {
    const { container, rerender, unmount } = render(answer(1, true));
    await expectNoAxeViolations(container, "busy region streaming");

    const button = container.querySelector("button")!;
    button.focus();
    await act(async () => rerender(answer(3, true)));
    expect(document.activeElement).toBe(button);
    expect(container.querySelector("[data-slot='busy-region']")?.getAttribute("aria-busy")).toBe(
      "true",
    );
    await expectNoAxeViolations(container, "busy region with more content");

    await act(async () => rerender(answer(3, false)));
    expect(container.querySelector("[data-slot='busy-region']")?.hasAttribute("aria-busy")).toBe(
      false,
    );
    await expectNoAxeViolations(container, "busy region settled");
    unmount();
  });
});
