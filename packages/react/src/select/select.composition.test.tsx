import { describe, expect, it } from "vitest";
import { fireClick, render } from "../../test/render.js";
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

  it("shows the registered label of options that are not direct children", () => {
    function Options() {
      return <SelectOption value="x">Registered label</SelectOption>;
    }
    const { container } = render(
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
    fireClick(container.querySelector("button")!);
  });
});
