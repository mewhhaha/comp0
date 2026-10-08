import { useControllableState } from "@comp0/core";
import { act, useRef } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import {
  synchronizeStandaloneRadioGroup,
  useFormReset,
  useStandaloneRadioSynchronization,
} from "./form-control-state.js";

function TextControl({ value }: { value?: string | undefined }) {
  const ref = useRef<HTMLInputElement>(null);
  const [current, setCurrent, state] = useControllableState({ value, defaultValue: "initial" });
  useFormReset({ controlRef: ref, state, readValue: (element) => element.value });
  return (
    <>
      <input
        ref={ref}
        aria-label="Text"
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
      />
      <output>{current}</output>
    </>
  );
}

function RadioControl({ label, value }: { label: string; value: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [checked, setChecked, state] = useControllableState({ defaultValue: false });
  useStandaloneRadioSynchronization({ inputRef: ref, state });
  return (
    <input
      ref={ref}
      type="radio"
      name="plan"
      aria-label={label}
      value={value}
      checked={checked}
      onChange={(event) => {
        setChecked(event.currentTarget.checked);
        synchronizeStandaloneRadioGroup(event.currentTarget);
      }}
    />
  );
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useFormReset", () => {
  it("returns an uncontrolled control to its default on form reset", async () => {
    const { container, user } = setup(
      <form>
        <TextControl />
      </form>,
    );
    const input = container.querySelector("input")!;

    await user.clear(input);
    await user.type(input, "changed");
    expect(input.value).toBe("changed");

    act(() => container.querySelector("form")!.reset());
    await settle();
    expect(input.value).toBe("initial");
  });

  it("leaves a reset that was cancelled alone", async () => {
    const { container, user } = setup(
      <form onReset={(event) => event.preventDefault()}>
        <TextControl />
      </form>,
    );
    const input = container.querySelector("input")!;

    await user.type(input, "!");
    act(() => container.querySelector("form")!.reset());
    await settle();
    expect(input.value).toBe("initial!");
  });

  it("does not listen for resets while the value is controlled", async () => {
    const { container } = setup(
      <form>
        <TextControl value="owned" />
      </form>,
    );
    const input = container.querySelector("input")!;

    act(() => container.querySelector("form")!.reset());
    await settle();
    expect(input.value).toBe("owned");
  });

  it("adopts the value the browser kept after a persisted page restore", () => {
    const { container } = setup(
      <form>
        <TextControl />
      </form>,
    );
    const input = container.querySelector("input")!;
    const state = container.querySelector("output")!;

    act(() => {
      input.value = "restored";
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    expect(state.textContent).toBe("restored");

    act(() => {
      input.value = "ignored";
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
    });
    expect(state.textContent).toBe("restored");
  });
});

describe("standalone radio synchronization", () => {
  it("clears a sibling's state when the browser unchecks it", async () => {
    const { container, user } = setup(
      <form>
        <RadioControl label="Free" value="free" />
        <RadioControl label="Pro" value="pro" />
      </form>,
    );
    const [free, pro] = [...container.querySelectorAll<HTMLInputElement>("input")];

    await user.click(free!);
    expect(free!.checked).toBe(true);
    await user.click(pro!);
    expect(pro!.checked).toBe(true);
    expect(free!.checked).toBe(false);
    // The state followed the DOM, so selecting the first again checks it again.
    await user.click(free!);
    expect(free!.checked).toBe(true);
    expect(pro!.checked).toBe(false);
  });

  it("ignores radios without a name", () => {
    const radio = document.createElement("input");
    radio.type = "radio";
    expect(() => synchronizeStandaloneRadioGroup(radio)).not.toThrow();
  });
});
