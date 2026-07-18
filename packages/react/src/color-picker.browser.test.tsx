import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import {
  ColorArea,
  ColorAreaThumb,
  ColorPicker,
  ColorPickerInput,
  ColorPickerPopover,
  ColorPickerTrigger,
  ColorSlider,
} from "./index.js";

describe("color picker browser interactions", () => {
  it("selects a point with one pointer action and restores trigger focus on Escape", async () => {
    const { unmount } = render(
      <ColorPicker defaultValue="#ff0000">
        <ColorPickerTrigger />
        <ColorPickerPopover>
          <ColorArea style={{ position: "relative", width: 200, height: 100 }}>
            <ColorAreaThumb style={{ position: "absolute" }} />
          </ColorArea>
          <ColorSlider channel="hue" />
          <ColorPickerInput />
        </ColorPickerPopover>
      </ColorPicker>,
    );
    const trigger = page.getByRole("button", { name: "Choose color" });
    const area = page.getByRole("group", { name: "Color" });
    const triggerElement = trigger.element();

    await act(async () => trigger.click());
    const areaElement = area.element();
    await act(async () => area.click());

    expect(areaElement.getAttribute("data-value")).toBe("#804040");
    expect(document.activeElement?.getAttribute("data-color-area-input")).toBe("saturation");

    await act(async () => userEvent.keyboard("{Escape}"));
    expect(triggerElement.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(triggerElement);
    unmount();
  });
});
