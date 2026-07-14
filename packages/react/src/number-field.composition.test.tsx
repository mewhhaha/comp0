import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Label } from "./components/Label.js";
import { NumberField } from "./components/NumberField.js";
import { NumberFieldDecrement } from "./components/NumberFieldDecrement.js";
import { NumberFieldIncrement } from "./components/NumberFieldIncrement.js";
import { NumberFieldInput } from "./components/NumberFieldInput.js";

describe("number field composition", () => {
  it("connects a native number input to custom step buttons", () => {
    const changed = vi.fn();
    const { container } = render(
      <NumberField
        id="tickets"
        name="tickets"
        defaultValue={1}
        min={1}
        max={5}
        step={2}
        required
        onChange={changed}
      >
        <Label>Tickets</Label>
        <NumberFieldDecrement>−</NumberFieldDecrement>
        <NumberFieldInput />
        <NumberFieldIncrement>+</NumberFieldIncrement>
      </NumberField>,
    );
    const input = container.querySelector("input")!;
    const [decrement, increment] = [...container.querySelectorAll("button")];

    expect(input.type).toBe("number");
    expect(input.name).toBe("tickets");
    expect(input.required).toBe(true);
    expect(input.min).toBe("1");
    expect(input.max).toBe("5");
    expect(input.step).toBe("2");
    expect(container.querySelector("label")?.htmlFor).toBe("tickets");
    expect(decrement?.type).toBe("button");
    expect(decrement?.tabIndex).toBe(-1);
    expect(decrement?.disabled).toBe(true);
    expect(decrement?.getAttribute("aria-label")).toBe("Decrease value");
    expect(increment?.getAttribute("aria-controls")).toBe("tickets");

    fireClick(increment!);
    expect(input.valueAsNumber).toBe(3);
    expect(changed).toHaveBeenLastCalledWith(3);
    expect(container.querySelector("output")?.textContent).toBe("3");
    expect(decrement?.disabled).toBe(false);

    fireClick(increment!);
    expect(input.valueAsNumber).toBe(5);
    expect(increment?.disabled).toBe(true);
    expect(increment?.hasAttribute("data-disabled")).toBe(true);
  });

  it("keeps a controlled value until its owner accepts the step", () => {
    const changed = vi.fn();
    const { container, rerender } = render(
      <NumberField id="quantity" value={2} onChange={changed}>
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberField>,
    );

    fireClick(container.querySelector("button")!);
    expect(changed).toHaveBeenLastCalledWith(3);
    expect(container.querySelector("input")?.valueAsNumber).toBe(2);

    rerender(
      <NumberField id="quantity" value={3} onChange={changed}>
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberField>,
    );
    expect(container.querySelector("input")?.valueAsNumber).toBe(3);
  });

  it("allows consumers to veto a step", () => {
    const changed = vi.fn();
    const { container } = render(
      <NumberField defaultValue={2} onChange={changed}>
        <NumberFieldInput />
        <NumberFieldIncrement onClick={(event) => event.preventDefault()} />
      </NumberField>,
    );
    const input = container.querySelector("input")!;

    fireClick(container.querySelector("button")!);
    expect(input.valueAsNumber).toBe(2);
    expect(changed).not.toHaveBeenCalled();
  });

  it("uses an explicit accessible name and tab order when provided", () => {
    const { container } = render(
      <NumberField defaultValue={2}>
        <span id="increase-tickets">Add ticket</span>
        <NumberFieldInput />
        <NumberFieldIncrement aria-labelledby="increase-tickets" tabIndex={0} />
      </NumberField>,
    );
    const increment = container.querySelector("button")!;

    expect(increment.getAttribute("aria-label")).toBeNull();
    expect(increment.getAttribute("aria-labelledby")).toBe("increase-tickets");
    expect(increment.tabIndex).toBe(0);
  });

  it("disables the input and both step buttons with the field", () => {
    const { container } = render(
      <NumberField defaultValue={2} disabled>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberField>,
    );

    expect(container.querySelector("input")?.disabled).toBe(true);
    expect([...container.querySelectorAll("button")].every((button) => button.disabled)).toBe(true);
  });
});
