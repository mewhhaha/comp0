import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Steps } from "./components/Steps.js";
import { StepsItem } from "./components/StepsItem.js";
import { StepsList } from "./components/StepsList.js";
import { StepsPanel } from "./components/StepsPanel.js";
import { StepsTrigger } from "./components/StepsTrigger.js";

function Checkout(props: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <Steps as="div" {...props}>
      <StepsList>
        {["shipping", "payment", "review"].map((step) => (
          <StepsItem key={step} value={step}>
            <StepsTrigger>{step}</StepsTrigger>
          </StepsItem>
        ))}
      </StepsList>
      <StepsPanel value="shipping">Shipping form</StepsPanel>
      <StepsPanel value="payment">Payment form</StepsPanel>
      <StepsPanel value="review">Review order</StepsPanel>
    </Steps>
  );
}

describe("steps composition", () => {
  it("numbers items in document order and marks the ones before the current step completed", () => {
    const { container } = render(<Checkout defaultValue="review" />);

    const items = [...container.querySelectorAll("ol > li")];
    expect(items.map((item) => item.getAttribute("data-step"))).toEqual(["1", "2", "3"]);
    expect(items.map((item) => item.hasAttribute("data-completed"))).toEqual([true, true, false]);
    expect(items.map((item) => item.hasAttribute("data-current"))).toEqual([false, false, true]);
  });

  it("jumps to a clicked step, moving aria-current and the visible panel", () => {
    const onChange = vi.fn();
    const { container } = render(<Checkout defaultValue="shipping" onChange={onChange} />);
    const trigger = (text: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].find(
        (element) => element.textContent === text,
      )!;

    expect(trigger("shipping").getAttribute("aria-current")).toBe("step");
    fireClick(trigger("payment"));

    expect(onChange).toHaveBeenCalledWith("payment");
    expect(trigger("shipping").hasAttribute("aria-current")).toBe(false);
    expect(trigger("payment").getAttribute("aria-current")).toBe("step");
    const panels = [...container.querySelectorAll("[data-slot='steps-panel']")];
    expect(panels.map((panel) => panel.hasAttribute("hidden"))).toEqual([true, false, true]);
  });

  it("keeps a controlled value until its owner applies the change", () => {
    const onChange = vi.fn();
    const { container } = render(<Checkout value="shipping" onChange={onChange} />);
    const payment = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent === "payment",
    )!;

    fireClick(payment);

    expect(onChange).toHaveBeenCalledWith("payment");
    expect(payment.hasAttribute("data-current")).toBe(false);
    expect(container.querySelector("[data-current]")?.textContent).toContain("shipping");
  });

  it("drives completion from an owner-updated controlled value", () => {
    function Example() {
      const [step, setStep] = useState("shipping");
      return <Checkout value={step} onChange={setStep} />;
    }
    const { container } = render(<Example />);

    fireClick(
      [...container.querySelectorAll<HTMLButtonElement>("button")].find(
        (element) => element.textContent === "review",
      )!,
    );

    const items = [...container.querySelectorAll("ol > li")];
    expect(items.map((item) => item.hasAttribute("data-completed"))).toEqual([true, true, false]);
  });

  it("labels each panel by its step item", () => {
    const { container } = render(<Checkout defaultValue="shipping" />);

    const item = container.querySelector("[data-slot='steps-item']")!;
    const panel = container.querySelector("[data-slot='steps-panel']")!;
    expect(item.id).not.toBe("");
    expect(panel.getAttribute("aria-labelledby")).toBe(item.id);
    expect(panel.getAttribute("role")).toBe("region");
  });

  it("passes step, current, and completed to item children functions", () => {
    const { container } = render(
      <Steps defaultValue="payment">
        <StepsList>
          <StepsItem value="shipping">
            {({ step, current, completed }) => `${step}:${current}:${completed}`}
          </StepsItem>
          <StepsItem value="payment">
            {({ step, current, completed }) => `${step}:${current}:${completed}`}
          </StepsItem>
        </StepsList>
      </Steps>,
    );

    const items = [...container.querySelectorAll("li")];
    expect(items.map((item) => item.textContent)).toEqual(["1:false:true", "2:true:false"]);
  });

  it("throws when an item or panel renders outside Steps", () => {
    expect(() => render(<StepsItem value="shipping" />)).toThrow(
      "StepsItem must be rendered inside Steps.",
    );
    expect(() => render(<StepsPanel value="shipping" />)).toThrow(
      "StepsPanel must be rendered inside Steps.",
    );
  });
});
