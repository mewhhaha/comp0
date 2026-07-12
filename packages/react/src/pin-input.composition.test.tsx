import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { PinInput } from "./components/PinInput.js";
import { PinInputField } from "./components/PinInputField.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function firePaste(element: Element, text: string) {
  act(() => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
    element.dispatchEvent(event);
  });
}

function focus(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function renderPin(props: Partial<Parameters<typeof PinInput>[0]> = {}) {
  const result = render(
    <PinInput aria-label="Verification code" {...props}>
      <PinInputField aria-label="Digit 1" />
      <PinInputField aria-label="Digit 2" />
      <PinInputField aria-label="Digit 3" />
      <PinInputField aria-label="Digit 4" />
    </PinInput>,
  );
  const fields = [...result.container.querySelectorAll<HTMLInputElement>("input")].filter(
    (input) => input.type !== "hidden",
  );
  return { ...result, fields };
}

describe("pin input composition", () => {
  it("renders a named group of single-character fields", () => {
    const { container, fields } = renderPin();
    const group = container.querySelector<HTMLElement>("[role='group']")!;

    expect(group.getAttribute("aria-label")).toBe("Verification code");
    expect(fields).toHaveLength(4);
    for (const field of fields) {
      expect(field.maxLength).toBe(1);
      expect(field.getAttribute("inputmode")).toBe("numeric");
    }
    // Only the first field advertises the platform one-time-code autofill.
    expect(fields[0]!.getAttribute("autocomplete")).toBe("one-time-code");
    expect(fields[1]!.getAttribute("autocomplete")).toBeNull();
  });

  it("fills and advances focus while typing", () => {
    const onChange = vi.fn();
    const { fields } = renderPin({ onChange });

    focus(fields[0]!);
    fireInput(fields[0]!, "1");
    expect(onChange).toHaveBeenLastCalledWith("1");
    expect(fields[0]!.value).toBe("1");
    expect(document.activeElement).toBe(fields[1]);

    fireInput(fields[1]!, "2");
    expect(onChange).toHaveBeenLastCalledWith("12");
    expect(document.activeElement).toBe(fields[2]);
  });

  it("filters characters by type", () => {
    const numeric = renderPin();
    focus(numeric.fields[0]!);
    fireInput(numeric.fields[0]!, "a");
    expect(numeric.fields[0]!.value).toBe("");
    expect(document.activeElement).toBe(numeric.fields[0]);
    numeric.unmount();

    const onChange = vi.fn();
    const alphanumeric = renderPin({ type: "alphanumeric", onChange });
    focus(alphanumeric.fields[0]!);
    fireInput(alphanumeric.fields[0]!, "a");
    expect(onChange).toHaveBeenLastCalledWith("a");
    expect(alphanumeric.fields[0]!.value).toBe("a");
  });

  it("clears with Backspace, then moves back once the field is empty", () => {
    const onChange = vi.fn();
    const { fields } = renderPin({ defaultValue: "12", onChange });

    focus(fields[1]!);
    fireKeyDown(fields[1]!, "Backspace");
    expect(onChange).toHaveBeenLastCalledWith("1");
    expect(fields[1]!.value).toBe("");
    expect(document.activeElement).toBe(fields[1]);

    fireKeyDown(fields[1]!, "Backspace");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(fields[0]);
  });

  it("moves focus with ArrowLeft and ArrowRight", () => {
    const { fields } = renderPin();

    focus(fields[1]!);
    fireKeyDown(fields[1]!, "ArrowRight");
    expect(document.activeElement).toBe(fields[2]);
    fireKeyDown(fields[2]!, "ArrowLeft");
    expect(document.activeElement).toBe(fields[1]);
    fireKeyDown(fields[1]!, "ArrowLeft");
    fireKeyDown(fields[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(fields[0]);
  });

  it("distributes a pasted code from the focused field", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const { fields } = renderPin({ onChange, onComplete });

    focus(fields[0]!);
    firePaste(fields[0]!, "1-2 3.4");
    expect(onChange).toHaveBeenLastCalledWith("1234");
    expect(fields.map((field) => field.value)).toEqual(["1", "2", "3", "4"]);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    expect(document.activeElement).toBe(fields[3]);
  });

  it("pastes from a later field without touching earlier characters", () => {
    const onChange = vi.fn();
    const { fields } = renderPin({ defaultValue: "9", onChange });

    focus(fields[1]!);
    firePaste(fields[1]!, "123");
    expect(onChange).toHaveBeenLastCalledWith("9123");
    expect(document.activeElement).toBe(fields[3]);
  });

  it("fires onComplete once per fill", () => {
    const onComplete = vi.fn();
    const { fields } = renderPin({ onComplete });

    focus(fields[0]!);
    fireInput(fields[0]!, "1");
    fireInput(fields[1]!, "2");
    fireInput(fields[2]!, "3");
    expect(onComplete).not.toHaveBeenCalled();
    fireInput(fields[3]!, "4");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");

    // Retyping over a filled code does not refire.
    fireInput(fields[2]!, "7");
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Emptying a field and filling it again completes again.
    fireKeyDown(fields[3]!, "Backspace");
    fireInput(fields[3]!, "9");
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith("1279");
  });

  it("submits the joined code through one hidden input", () => {
    const { container, fields } = renderPin({ name: "otp", defaultValue: "12" });
    const hidden = container.querySelector<HTMLInputElement>('input[name="otp"]')!;

    expect(hidden.type).toBe("hidden");
    expect(hidden.value).toBe("12");
    fireInput(fields[2]!, "3");
    expect(hidden.value).toBe("123");
  });

  it("masks fields as password inputs", () => {
    const { fields } = renderPin({ mask: true });
    for (const field of fields) {
      expect(field.type).toBe("password");
    }
  });

  it("keeps the caller in charge when controlled", () => {
    const onChange = vi.fn();
    const view = (value: string) => (
      <PinInput aria-label="Verification code" value={value} onChange={onChange}>
        <PinInputField aria-label="Digit 1" />
        <PinInputField aria-label="Digit 2" />
      </PinInput>
    );
    const { container, rerender } = render(view("1"));
    const fields = [...container.querySelectorAll<HTMLInputElement>("input")];

    fireInput(fields[1]!, "2");
    expect(onChange).toHaveBeenLastCalledWith("12");
    // Controlled: the field only fills when the caller feeds the value back.
    expect(fields[1]!.value).toBe("");
    rerender(view("12"));
    expect(fields[1]!.value).toBe("2");
  });

  it("selects the current character when a field gains focus", () => {
    const { fields } = renderPin({ defaultValue: "1" });
    const select = vi.spyOn(fields[0]!, "select");

    focus(fields[0]!);
    expect(select).toHaveBeenCalled();
  });

  it("disables every field and blocks editing", () => {
    const onChange = vi.fn();
    const { container, fields } = renderPin({ disabled: true, name: "otp", onChange });

    expect(
      container.querySelector<HTMLElement>("[role='group']")!.hasAttribute("data-disabled"),
    ).toBe(true);
    for (const field of fields) {
      expect(field.disabled).toBe(true);
    }
    fireKeyDown(fields[0]!, "Backspace");
    expect(onChange).not.toHaveBeenCalled();
  });
});
