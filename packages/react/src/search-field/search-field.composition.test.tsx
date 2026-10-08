import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { SearchField } from "./SearchField.js";
import { SearchFieldClear } from "./SearchFieldClear.js";
import { SearchFieldInput } from "./SearchFieldInput.js";

describe("search field composition", () => {
  it("shows the clear button only while the search field has a value", async () => {
    const changed = vi.fn();
    const cleared = vi.fn();
    const { container, user } = setup(
      <SearchField onChange={changed} onClear={cleared}>
        <SearchFieldInput aria-label="Search docs" />
        <SearchFieldClear aria-label="Clear search" />
      </SearchField>,
    );
    const input = container.querySelector("input")!;

    expect(container.querySelector("button")).toBeNull();
    await user.type(input, "docs");
    expect(changed).toHaveBeenLastCalledWith("docs");

    const clear = container.querySelector("button")!;
    await user.click(clear);

    expect(input.value).toBe("");
    expect(changed).toHaveBeenLastCalledWith("");
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(container.querySelector("button")).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("keeps the clear button until a controlled owner accepts the empty value", async () => {
    const changed = vi.fn();
    const { container, rerender, user } = setup(
      <SearchField value="docs" onChange={changed}>
        <SearchFieldInput aria-label="Search docs" />
        <SearchFieldClear aria-label="Clear search" />
      </SearchField>,
    );

    await user.click(container.querySelector("button")!);
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
