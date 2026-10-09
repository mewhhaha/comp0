import { useState } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import {
  Citation,
  Citations,
  Comparison,
  ComparisonBody,
  ComparisonFeature,
  ComparisonHeader,
  ComparisonOption,
  ComparisonRow,
  ComparisonValue,
  Output,
  Slider,
  Source,
  Sources,
} from "./index.js";
import { expectNoAxeViolations } from "../test/axe.js";
import { render } from "../test/render.js";

function Price() {
  const [seats, setSeats] = useState(2);
  return (
    <form aria-label="Pricing">
      <Slider aria-label="Seats" id="seats" min={1} max={10} value={seats} onChange={setSeats} />
      <Output htmlFor="seats" name="total">
        ${seats * 12}
      </Output>
    </form>
  );
}

describe("answer primitives in a real browser", () => {
  it("updates an output from a slider with no axe violations", async () => {
    const { container, unmount } = render(<Price />);
    await expectNoAxeViolations(container, "initial");

    const slider = page.getByRole("slider", { name: "Seats" });
    await slider.click();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");

    const output = container.querySelector("output");
    expect(output?.textContent).not.toBe("$24");
    expect(output?.getAttribute("for")).toBe("seats");
    await expectNoAxeViolations(container, "after change");
    unmount();
  });

  it("names a recommended column and boolean values for assistive technology", async () => {
    const { container, unmount } = render(
      <Comparison aria-label="Plans">
        <ComparisonHeader>
          <tr>
            <th scope="col">Feature</th>
            <ComparisonOption value="free">Free</ComparisonOption>
            <ComparisonOption value="pro" recommended>
              Pro
            </ComparisonOption>
          </tr>
        </ComparisonHeader>
        <ComparisonBody>
          <ComparisonRow>
            <ComparisonFeature>Support</ComparisonFeature>
            <ComparisonValue option="free" included={false}>
              -
            </ComparisonValue>
            <ComparisonValue option="pro" included>
              +
            </ComparisonValue>
          </ComparisonRow>
        </ComparisonBody>
      </Comparison>,
    );

    await expect
      .element(page.getByRole("columnheader", { name: /Pro.*Recommended/ }))
      .toBeInTheDocument();
    await expect.element(page.getByRole("cell", { name: "Included" })).toBeInTheDocument();
    await expect.element(page.getByRole("cell", { name: "Not included" })).toBeInTheDocument();
    await expectNoAxeViolations(container);
    unmount();
  });

  it("moves to a source when its citation is followed", async () => {
    const { container, unmount } = render(
      <Citations as="div">
        <p>
          Tea <Citation value="atlas" />
        </p>
        <Sources aria-label="Sources">
          <Source value="atlas" title="Tea atlas" href="https://example.com" />
        </Sources>
      </Citations>,
    );
    await expectNoAxeViolations(container, "initial");

    const citation = page.getByRole("link", { name: "Source 1: Tea atlas" });
    await citation.click();
    const href = citation.element().getAttribute("href") ?? "";
    expect(location.hash).toBe(href);
    await expectNoAxeViolations(container, "after following");
    unmount();
  });
});
