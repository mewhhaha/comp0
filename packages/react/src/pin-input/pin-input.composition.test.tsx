import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { PinInput } from "./PinInput.js";
import { PinInputField } from "./PinInputField.js";

function renderPin(props: Partial<Parameters<typeof PinInput>[0]> = {}) {
  const result = setup(
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

  it("fills and advances focus while typing", async () => {
    const onChange = vi.fn();
    const { fields, user } = renderPin({ onChange });

    await user.click(fields[0]!);
    await user.keyboard("1");
    expect(onChange).toHaveBeenLastCalledWith("1");
    expect(fields[0]!.value).toBe("1");
    expect(document.activeElement).toBe(fields[1]);

    await user.keyboard("2");
    expect(onChange).toHaveBeenLastCalledWith("12");
    expect(document.activeElement).toBe(fields[2]);
  });

  it("fills the first empty slot when a later empty field is focused", async () => {
    const onChange = vi.fn();
    const { fields, user } = renderPin({ onChange });

    await user.click(fields[3]!);
    await user.keyboard("4");

    expect(onChange).toHaveBeenLastCalledWith("4");
    expect(fields.map((field) => field.value)).toEqual(["4", "", "", ""]);
    expect(document.activeElement).toBe(fields[1]);
  });

  it("filters characters by type", async () => {
    const numeric = renderPin();
    await numeric.user.click(numeric.fields[0]!);
    await numeric.user.keyboard("a");
    expect(numeric.fields[0]!.value).toBe("");
    expect(document.activeElement).toBe(numeric.fields[0]);
    numeric.unmount();

    const onChange = vi.fn();
    const alphanumeric = renderPin({ type: "alphanumeric", onChange });
    await alphanumeric.user.click(alphanumeric.fields[0]!);
    await alphanumeric.user.keyboard("a");
    expect(onChange).toHaveBeenLastCalledWith("a");
    expect(alphanumeric.fields[0]!.value).toBe("a");
  });

  it("clears with Backspace, then moves back once the field is empty", async () => {
    const onChange = vi.fn();
    const { fields, user } = renderPin({ defaultValue: "12", onChange });

    await user.click(fields[1]!);
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith("1");
    expect(fields[1]!.value).toBe("");
    expect(document.activeElement).toBe(fields[1]);

    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(fields[0]);
  });

  it("moves focus with ArrowLeft and ArrowRight", async () => {
    const { fields, user } = renderPin();

    await user.click(fields[1]!);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(fields[2]);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(fields[1]);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(fields[0]);
  });

  it("mirrors field arrows in right-to-left layouts", async () => {
    const { container, fields, user } = renderPin();
    container.querySelector<HTMLElement>("[role='group']")!.style.direction = "rtl";
    await user.click(fields[1]!);

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(fields[2]);
  });

  it("distributes a pasted code from the focused field", async () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const { fields, user } = renderPin({ onChange, onComplete });

    await user.click(fields[0]!);
    await user.paste("1-2 3.4");
    expect(onChange).toHaveBeenLastCalledWith("1234");
    expect(fields.map((field) => field.value)).toEqual(["1", "2", "3", "4"]);
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    expect(document.activeElement).toBe(fields[3]);
  });

  it("pastes from a later field without touching earlier characters", async () => {
    const onChange = vi.fn();
    const { fields, user } = renderPin({ defaultValue: "9", onChange });

    await user.click(fields[1]!);
    await user.paste("123");
    expect(onChange).toHaveBeenLastCalledWith("9123");
    expect(document.activeElement).toBe(fields[3]);
  });

  it("fires onComplete once per fill", async () => {
    const onComplete = vi.fn();
    const { fields, user } = renderPin({ onComplete });

    await user.click(fields[0]!);
    await user.keyboard("123");
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard("4");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");

    // Retyping over a filled code does not refire.
    await user.click(fields[2]!);
    await user.keyboard("7");
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Emptying a field and filling it again completes again.
    await user.click(fields[3]!);
    await user.keyboard("{Backspace}9");
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith("1279");
  });

  it("submits the joined code through one hidden input", async () => {
    const { container, fields, user } = renderPin({ name: "otp", defaultValue: "12" });
    const hidden = container.querySelector<HTMLInputElement>('input[name="otp"]')!;

    expect(hidden.type).toBe("hidden");
    expect(hidden.value).toBe("12");
    await user.click(fields[2]!);
    await user.keyboard("3");
    expect(hidden.value).toBe("123");
  });

  it("masks fields as password inputs", () => {
    const { fields } = renderPin({ mask: true });
    for (const field of fields) {
      expect(field.type).toBe("password");
    }
  });

  it("keeps the caller in charge when controlled", async () => {
    const onChange = vi.fn();
    const view = (value: string) => (
      <PinInput aria-label="Verification code" value={value} onChange={onChange}>
        <PinInputField aria-label="Digit 1" />
        <PinInputField aria-label="Digit 2" />
      </PinInput>
    );
    const { container, rerender, user } = setup(view("1"));
    const fields = [...container.querySelectorAll<HTMLInputElement>("input")];

    await user.click(fields[1]!);
    await user.keyboard("2");
    expect(onChange).toHaveBeenLastCalledWith("12");
    // Controlled: the field only fills when the caller feeds the value back.
    expect(fields[1]!.value).toBe("");
    rerender(view("12"));
    expect(fields[1]!.value).toBe("2");
  });

  it("selects the current character when a field gains focus", async () => {
    const { fields, user } = renderPin({ defaultValue: "1" });
    const select = vi.spyOn(fields[0]!, "select");

    await user.click(fields[0]!);
    expect(select).toHaveBeenCalled();
  });

  it("disables every field and blocks editing", async () => {
    const onChange = vi.fn();
    const { container, fields, user } = renderPin({ disabled: true, name: "otp", onChange });

    expect(
      container.querySelector<HTMLElement>("[role='group']")!.hasAttribute("data-disabled"),
    ).toBe(true);
    for (const field of fields) {
      expect(field.disabled).toBe(true);
    }
    await user.click(fields[0]!);
    await user.keyboard("{Backspace}");
    expect(onChange).not.toHaveBeenCalled();
  });
});
