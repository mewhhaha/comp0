import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { SearchField } from "./components/SearchField.js";
import { SearchFieldClear } from "./components/SearchFieldClear.js";
import { SearchFieldInput } from "./components/SearchFieldInput.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

describe("search field composition", () => {
  it("shows the clear button only while the search field has a value", () => {
    const changed = vi.fn();
    const cleared = vi.fn();
    const { container } = render(
      <SearchField onChange={changed} onClear={cleared}>
        <SearchFieldInput aria-label="Search docs" />
        <SearchFieldClear aria-label="Clear search" />
      </SearchField>,
    );
    const input = container.querySelector("input")!;

    expect(container.querySelector("button")).toBeNull();
    fireInput(input, "docs");
    expect(changed).toHaveBeenLastCalledWith("docs");

    const clear = container.querySelector("button")!;
    act(() => clear.focus());
    fireClick(clear);

    expect(input.value).toBe("");
    expect(changed).toHaveBeenLastCalledWith("");
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(container.querySelector("button")).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("keeps the clear button until a controlled owner accepts the empty value", () => {
    const changed = vi.fn();
    const { container, rerender } = render(
      <SearchField value="docs" onChange={changed}>
        <SearchFieldInput aria-label="Search docs" />
        <SearchFieldClear aria-label="Clear search" />
      </SearchField>,
    );

    fireClick(container.querySelector("button")!);
    expect(changed).toHaveBeenLastCalledWith("");
    expect(container.querySelector("input")?.value).toBe("docs");
    expect(container.querySelector("button")).not.toBeNull();

    rerender(
      <SearchField value="" onChange={changed}>
        <SearchFieldInput aria-label="Search docs" />
        <SearchFieldClear aria-label="Clear search" />
      </SearchField>,
    );
    expect(container.querySelector("button")).toBeNull();
  });
});
