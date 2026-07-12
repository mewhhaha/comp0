import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { ColorField } from "./components/ColorField.js";
import { Description } from "./components/Description.js";
import { Label } from "./components/Label.js";
import { TextField } from "./components/TextField.js";

function fireChange(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("color field composition", () => {
  it("wires the label, id, and description from the surrounding TextField", () => {
    const { container } = render(
      <TextField>
        <Label>Accent color</Label>
        <ColorField name="accent" />
        <Description>Used for highlights.</Description>
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const label = container.querySelector<HTMLLabelElement>("label")!;
    expect(input.type).toBe("color");
    expect(input.id).toBe(label.htmlFor);
    const description = document.getElementById(input.getAttribute("aria-describedby")!)!;
    expect(description.textContent).toBe("Used for highlights.");
  });

  it("takes disabled, invalid, and required from the field with data attributes", () => {
    const { container } = render(
      <TextField disabled invalid required>
        <Label>Accent color</Label>
        <ColorField />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("data-disabled")).toBe(true);
    expect(input.hasAttribute("data-invalid")).toBe(true);
    expect(input.hasAttribute("data-required")).toBe(true);
  });

  it("lets local overrides win over the field state", () => {
    const { container } = render(
      <TextField disabled>
        <Label>Accent color</Label>
        <ColorField disabled={false} />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.disabled).toBe(false);
    expect(input.hasAttribute("data-disabled")).toBe(false);
  });

  it("participates in the field value and keeps the native onChange contract", () => {
    const onFieldChange = vi.fn();
    let seen: { element: HTMLInputElement; value: string } | null = null;
    // currentTarget is only set while the event dispatches, so capture it here.
    const onNativeChange = vi.fn((event: { currentTarget: HTMLInputElement }) => {
      seen = { element: event.currentTarget, value: event.currentTarget.value };
    });
    const { container } = render(
      <TextField defaultValue="#0d9488" onChange={onFieldChange}>
        <Label>Accent color</Label>
        <ColorField onChange={onNativeChange} />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.value).toBe("#0d9488");
    expect(input.getAttribute("data-value")).toBe("#0d9488");

    fireChange(input, "#22c55e");
    expect(onFieldChange).toHaveBeenLastCalledWith("#22c55e");
    expect(onNativeChange).toHaveBeenCalledTimes(1);
    expect(seen).toEqual({ element: input, value: "#22c55e" });
    expect(input.value).toBe("#22c55e");
  });

  it("submits under its native name inside a form", () => {
    const { container } = render(
      <form>
        <TextField defaultValue="#0d9488">
          <Label>Accent color</Label>
          <ColorField name="accent" />
        </TextField>
      </form>,
    );
    const form = container.querySelector<HTMLFormElement>("form")!;
    const data = new FormData(form);
    expect(data.get("accent")).toBe("#0d9488");
  });

  it("works standalone without a field context", () => {
    const { container } = render(<ColorField aria-label="Accent color" defaultValue="#0d9488" />);
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.type).toBe("color");
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(input.value).toBe("#0d9488");
  });
});
