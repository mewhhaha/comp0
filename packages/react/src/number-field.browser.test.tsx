import { act } from "react";
import { page, userEvent } from "vitest/browser";
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
    const { unmount } = render(
      <form onSubmit={submitted}>
        <NumberField defaultValue={1} min={1} max={3}>
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Tickets" />
          <NumberFieldIncrement />
        </NumberField>
        <button type="submit">Continue</button>
      </form>,
    );
    const input = page.getByRole("spinbutton", { name: "Tickets" }).element() as HTMLInputElement;
    const decrement = page
      .getByRole("button", { name: "Decrease value" })
      .element() as HTMLButtonElement;
    const increment = page.getByRole("button", { name: "Increase value" });
    const submit = page.getByRole("button", { name: "Continue" }).element();

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(input);
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(submit);

    await act(async () => increment.click());
    expect(input.valueAsNumber).toBe(2);
    await expect.element(page.getByRole("status")).toHaveTextContent("2");
    expect(decrement.disabled).toBe(false);
    expect(submitted).not.toHaveBeenCalled();
    unmount();
  });
});
