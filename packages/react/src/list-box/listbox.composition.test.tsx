import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { ListBox } from "./ListBox.js";
import { ListBoxOptGroup } from "./ListBoxOptGroup.js";
import { ListBoxOption } from "./ListBoxOption.js";
import { ListBoxSeparator } from "./ListBoxSeparator.js";

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

describe("ListBox parts", () => {
  it("renders parts as another element with `as` and requires its ListBox", () => {
    const { container, getByRole } = render(
      <ListBox as="ul" aria-label="Color" defaultValue="red">
        <ListBoxOptGroup as="li" aria-label="Warm">
          <ListBoxOption as="span" value="red">
            Red
          </ListBoxOption>
        </ListBoxOptGroup>
      </ListBox>,
    );

    expect(getByRole("listbox").tagName).toBe("UL");
    expect(getByRole("group").tagName).toBe("LI");
    expect(container.querySelector("[role='option']")?.tagName).toBe("SPAN");
    expect(getByRole("option").getAttribute("aria-selected")).toBe("true");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<ListBoxOption value="red">Red</ListBoxOption>)).toThrow(
        "ListBoxOption must be rendered inside ListBox.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe("ListBox selection", () => {
  it("keeps generic ListBox and ListBoxOption selection functional", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <ListBox aria-label="Libraries" onChange={changed}>
        <ListBoxOption id="react" value="react">
          React
        </ListBoxOption>
        <ListBoxOption id="solid" value="solid">
          Solid
        </ListBoxOption>
      </ListBox>,
    );
    const items = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.click(items[1]!);
    expect(items[1]?.getAttribute("aria-selected")).toBe("true");
    expect(changed).toHaveBeenLastCalledWith("solid");
    await user.keyboard("{ArrowUp}");
    expect(items[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps an enabled option reachable when the selected value is missing or disabled", () => {
    const { container, rerender } = render(
      <ListBox aria-label="Libraries" value="missing">
        <ListBoxOption value="react">React</ListBoxOption>
        <ListBoxOption value="solid">Solid</ListBoxOption>
      </ListBox>,
    );
    let options = container.querySelectorAll<HTMLElement>("[role='option']");
    expect(options[0]!.tabIndex).toBe(0);

    rerender(
      <ListBox aria-label="Libraries" value="react">
        <ListBoxOption value="react" disabled>
          React
        </ListBoxOption>
        <ListBoxOption value="solid">Solid</ListBoxOption>
      </ListBox>,
    );
    options = container.querySelectorAll<HTMLElement>("[role='option']");
    expect(options[0]!.hasAttribute("tabindex")).toBe(false);
    expect(options[1]!.tabIndex).toBe(0);
  });
});
