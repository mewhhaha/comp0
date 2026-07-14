import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "./index.js";

describe("number field browser interactions", () => {
  it("steps natively without adding redundant tab stops or submitting the form", async () => {
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container, unmount } = render(
      <form onSubmit={submitted}>
        <NumberField defaultValue={1} min={1} max={3}>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Tickets" />
          <NumberFieldIncrement />
        </NumberField>
        <button type="submit">Continue</button>
      </form>,
    );
    const input = container.querySelector("input")!;
    const [decrement, increment, submit] = [...container.querySelectorAll("button")];

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(input);
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(submit);

    await act(async () => userEvent.click(increment!));
    expect(input.valueAsNumber).toBe(2);
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(decrement?.disabled).toBe(false);
    expect(submitted).not.toHaveBeenCalled();
    unmount();
  });
});
