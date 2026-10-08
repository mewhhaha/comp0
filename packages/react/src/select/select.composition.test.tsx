import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Select } from "./Select.js";
import { SelectOptGroup } from "./SelectOptGroup.js";
import { SelectOption } from "./SelectOption.js";
import { SelectPopover } from "./SelectPopover.js";
import { SelectTrigger } from "./SelectTrigger.js";
import { SelectValue } from "./SelectValue.js";

describe("Select", () => {
  it("renders its parts as other elements with `as`", () => {
    const { container } = render(
      <Select as="section" id="as-select" defaultValue="b">
        <SelectTrigger>
          <SelectValue as="strong" placeholder="Choose" />
        </SelectTrigger>
        <SelectPopover as="ul">
          <SelectOptGroup as="li" label="Letters">
            <SelectOption as="span" value="a">
              Alpha
            </SelectOption>
            <SelectOption as="span" value="b">
              Beta
            </SelectOption>
          </SelectOptGroup>
        </SelectPopover>
      </Select>,
    );

    expect(container.querySelector("section")?.id).toBe("as-select");
    expect(container.querySelector("strong")?.textContent).toBe("Beta");
    expect(container.querySelector("ul[role='listbox']")).not.toBeNull();
    expect(container.querySelector("li[role='group']")?.getAttribute("aria-label")).toBe("Letters");
    expect(container.querySelectorAll("span[role='option']")).toHaveLength(2);
  });

  it("shows the registered label of options that are not direct children", async () => {
    function Options() {
      return <SelectOption value="x">Registered label</SelectOption>;
    }
    const { container, user } = setup(
      <Select defaultValue="x">
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectPopover>
          <Options />
        </SelectPopover>
      </Select>,
    );

    expect(container.querySelector("button span")?.textContent).toBe("Registered label");
    await user.click(container.querySelector("button")!);
  });

  it("toggles select content and commits a keyboard selection", async () => {
    const toggled = vi.fn();
    const { container, user } = setup(
      <Select id="plan" defaultValue="free" onOpenChange={toggled}>
        <SelectTrigger>Plan</SelectTrigger>
        <SelectPopover>
          <SelectOption value="free">Free</SelectOption>
          <SelectOption value="pro">Pro</SelectOption>
        </SelectPopover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    expect(content.hidden).toBe(true);
    await user.click(trigger);
    expect(content.hidden).toBe(false);
    expect(toggled).toHaveBeenLastCalledWith(true);
    expect(document.activeElement?.textContent).toBe("Free");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(content.hidden).toBe(true);
    expect(container.querySelector("[data-value='pro']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("changes the selection from typeahead on the closed select trigger", async () => {
    const { container, user } = setup(
      <Select id="plan" defaultValue="free">
        <SelectTrigger>Plan</SelectTrigger>
        <SelectPopover>
          <SelectOption value="free">Free</SelectOption>
          <SelectOption value="pro">Pro</SelectOption>
          <SelectOption value="team" disabled>
            Team
          </SelectOption>
        </SelectPopover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    await user.tab();
    expect(document.activeElement).toBe(trigger);
    await user.keyboard("p");
    expect(content.hidden).toBe(true);
    expect(container.querySelector("[data-value='pro']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
    await user.keyboard("t");
    expect(container.querySelector("[data-value='pro']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("navigates labelled select opt groups and submits the selected option", async () => {
    const { container, user } = setup(
      <form>
        <Select name="size" defaultValue="medium">
          <SelectTrigger>Size</SelectTrigger>
          <SelectPopover>
            <SelectOptGroup label="Standard sizes">
              <SelectOption value="small">Small</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
            </SelectOptGroup>
            <SelectOptGroup label="Extended sizes">
              <SelectOption value="large">Large</SelectOption>
            </SelectOptGroup>
          </SelectPopover>
        </Select>
      </form>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const groups = container.querySelectorAll<HTMLElement>("[role='group']");

    expect([...groups].map((group) => group.getAttribute("aria-label"))).toEqual([
      "Standard sizes",
      "Extended sizes",
    ]);
    await user.click(trigger);
    expect(document.activeElement?.textContent).toBe("Medium");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Large");
    await user.keyboard("{Enter}");

    expect(new FormData(container.querySelector("form")!).get("size")).toBe("large");
  });

  it("navigates select options in their current document order after reordering", async () => {
    function ReorderedSelect({ reversed }: { reversed: boolean }) {
      let options = [
        <SelectOption key="free" value="free">
          Free
        </SelectOption>,
        <SelectOption key="pro" value="pro">
          Pro
        </SelectOption>,
      ];
      if (reversed) options = [...options].reverse();
      return (
        <Select>
          <SelectTrigger>Plan</SelectTrigger>
          <SelectPopover>{options}</SelectPopover>
        </Select>
      );
    }

    const { container, rerender, user } = setup(<ReorderedSelect reversed={false} />);
    rerender(<ReorderedSelect reversed />);
    await user.click(container.querySelector("button")!);
    expect(document.activeElement?.textContent).toBe("Pro");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Free");
  });

  it("focuses the select trigger in the control's owning document after native validation", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const { container, unmount } = render(
      <Select id="framed-plan" name="plan" required>
        <SelectTrigger>Choose plan</SelectTrigger>
      </Select>,
      frameDocument,
    );
    const nativeSelect = container.querySelector("select")!;
    const trigger = container.querySelector("button")!;

    act(() => nativeSelect.dispatchEvent(new Event("invalid", { cancelable: true })));

    expect(frameDocument.activeElement).toBe(trigger);
    unmount();
    frame.remove();
  });
});
