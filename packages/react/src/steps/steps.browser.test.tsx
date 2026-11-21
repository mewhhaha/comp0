import { afterEach, describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { cleanupRoots, render } from "../../test/render.js";
import { Steps } from "./Steps.js";
import { StepsItem } from "./StepsItem.js";
import { StepsList } from "./StepsList.js";
import { StepsPanel } from "./StepsPanel.js";
import { StepsTrigger } from "./StepsTrigger.js";

afterEach(() => cleanupRoots());

const checkout = (names: string[]) => (
  <Steps defaultValue="payment">
    <StepsList aria-label="Checkout">
      {names.map((name) => (
        <StepsItem key={name} value={name}>
          <StepsTrigger>{name}</StepsTrigger>
        </StepsItem>
      ))}
    </StepsList>
    {names.map((name) => (
      <StepsPanel key={name} value={name} aria-label={name}>
        {name} form
      </StepsPanel>
    ))}
  </Steps>
);

const items = (container: Element) =>
  [...container.querySelectorAll("li")].map(
    (item) =>
      `${item.textContent}:${item.getAttribute("data-step")}${item.hasAttribute("data-completed") ? "+" : ""}`,
  );

describe("Steps in a browser", () => {
  it("numbers steps by document order after a keyed reorder, with no axe violations", async () => {
    const { container, rerender } = render(checkout(["shipping", "payment", "review"]));
    expect(items(container)).toEqual(["shipping:1+", "payment:2", "review:3"]);
    await expectNoAxeViolations(container, "steps with a completed step");

    rerender(checkout(["review", "payment", "shipping"]));
    expect(items(container)).toEqual(["review:1+", "payment:2", "shipping:3"]);
  });
});
