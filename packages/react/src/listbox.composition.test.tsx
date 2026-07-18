import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { ListBoxSeparator } from "./components/ListBoxSeparator.js";

describe("ListBoxSeparator", () => {
  it("is presentational by default", () => {
    const { getByRole } = render(<ListBoxSeparator />);

    expect(getByRole("presentation").hasAttribute("aria-orientation")).toBe(false);
  });

  it("provides a horizontal orientation when explicitly exposed as a separator", () => {
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The component exposes its DOM role override as part of its public contract.
    const { getByRole } = render(<ListBoxSeparator role="separator" />);

    expect(getByRole("separator").getAttribute("aria-orientation")).toBe("horizontal");
  });
});
