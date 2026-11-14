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

  it("advances from the focused option when a controlled value rejects every change", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <ListBox aria-label="Libraries" value="react">
          <ListBoxOption value="react">React</ListBoxOption>
          <ListBoxOption value="solid">Solid</ListBoxOption>
          <ListBoxOption value="vue">Vue</ListBoxOption>
        </ListBox>
      </>,
    );
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.click(container.querySelector("button")!);
    await user.tab();
    expect(document.activeElement).toBe(options[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[1]);
    expect(options[1]!.tabIndex).toBe(0);
    expect(options[0]!.tabIndex).toBe(-1);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[2]);
    expect(options[2]!.tabIndex).toBe(0);
    expect(options[1]!.tabIndex).toBe(-1);
    expect(options[0]!.getAttribute("aria-selected")).toBe("true");
    unmount();
  });

  it("moves with Home, End, and typeahead, and wraps at the ends", async () => {
    const { container, user, unmount } = setup(
      <ListBox aria-label="Libraries">
        <ListBoxOption value="react">React</ListBoxOption>
        <ListBoxOption value="solid">Solid</ListBoxOption>
        <ListBoxOption value="vue">Vue</ListBoxOption>
      </ListBox>,
    );
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.tab();
    expect(document.activeElement).toBe(options[0]);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(options[2]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[0]);
    await user.keyboard("s");
    expect(document.activeElement).toBe(options[1]);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(options[0]);
    unmount();
  });

  it("keeps no tab stop when every option is disabled and none when the list is empty", () => {
    const { container, unmount } = render(
      <ListBox aria-label="Libraries">
        <ListBoxOption value="react" disabled>
          React
        </ListBoxOption>
        <ListBoxOption value="solid" disabled>
          Solid
        </ListBoxOption>
      </ListBox>,
    );
    const options = container.querySelectorAll<HTMLElement>("[role='option']");
    expect([...options].map((option) => option.hasAttribute("tabindex"))).toEqual([false, false]);
    unmount();

    const empty = render(<ListBox aria-label="Libraries" value="missing" />);
    expect(empty.container.querySelector("[role='listbox']")).toBeTruthy();
    empty.unmount();
  });

  it("moves the stop to the first enabled option when the focused option unmounts", async () => {
    const list = (values: string[]) => (
      <ListBox aria-label="Libraries">
        {values.map((value) => (
          <ListBoxOption key={value} value={value}>
            {value}
          </ListBoxOption>
        ))}
      </ListBox>
    );
    const { container, rerender, user, unmount } = setup(list(["react", "solid", "vue"]));
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.click(options[1]!);
    expect(document.activeElement).toBe(options[1]);
    rerender(list(["react", "vue"]));
    const stops = container.querySelectorAll<HTMLElement>("[role='option'][tabindex='0']");
    expect([...stops].map((option) => option.dataset.value)).toEqual(["react"]);
    unmount();
  });

  it("moves the stop when the option holding it changes its value", () => {
    const list = (second: string) => (
      <ListBox aria-label="Libraries" defaultValue="solid">
        <ListBoxOption value="react">React</ListBoxOption>
        <ListBoxOption value={second}>{second}</ListBoxOption>
        <ListBoxOption value="vue">Vue</ListBoxOption>
      </ListBox>
    );
    const { container, rerender, unmount } = render(list("solid"));
    rerender(list("lit"));
    const stops = container.querySelectorAll<HTMLElement>("[role='option'][tabindex='0']");
    expect([...stops].map((option) => option.dataset.value)).toEqual(["react"]);
    unmount();
  });
});
