import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Popover,
  Radio,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "./index.js";
import { fireClick, render } from "../test/render.js";

describe("foundation components", () => {
  it("keeps generic buttons independent from picker state", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Select defaultValue="alpha">
        <Button onClick={clicked}>Generic action</Button>
        <Popover>
          <SelectTrigger>Open</SelectTrigger>
          <SelectPopover>
            <SelectOption value="alpha">Alpha</SelectOption>
          </SelectPopover>
        </Popover>
      </Select>,
    );
    const buttons = container.querySelectorAll("button");
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    fireClick(buttons[0]!);
    expect(clicked).toHaveBeenCalledOnce();
    expect(content.hidden).toBe(true);
    fireClick(buttons[1]!);
    expect(content.hidden).toBe(false);
  });

  it("forwards explicit field validity and presence-based state attributes", () => {
    const { container } = render(
      <TextField id="email">
        <Label>Email</Label>
        <Input aria-invalid="grammar" />
      </TextField>,
    );
    const input = container.querySelector("input")!;

    expect(input.id).toBe("email");
    expect(input.getAttribute("aria-invalid")).toBe("grammar");
    expect(input.hasAttribute("data-invalid")).toBe(true);
    expect(input.getAttribute("data-invalid")).toBe("");
  });

  it("supports native standalone radio and checkbox form state", () => {
    const radioChanged = vi.fn();
    const checkboxChanged = vi.fn();
    const { container } = render(
      <form>
        <Radio name="density" value="compact" defaultSelected onChange={radioChanged}>
          Compact
        </Radio>
        <Checkbox name="alerts" value="email" onChange={checkboxChanged}>
          Email alerts
        </Checkbox>
      </form>,
    );
    const controls = container.querySelectorAll<HTMLInputElement>("input");

    expect(controls[0]?.name).toBe("density");
    expect(controls[0]?.checked).toBe(true);
    act(() => controls[1]?.click());
    expect(checkboxChanged).toHaveBeenLastCalledWith(true);
    expect(new FormData(container.querySelector("form")!).get("alerts")).toBe("email");
  });

  it("exposes semantic toggle state and group orientation", () => {
    const { container } = render(
      <ToggleButtonGroup orientation="vertical" aria-label="Formatting">
        <ToggleButton defaultSelected>Bold</ToggleButton>
      </ToggleButtonGroup>,
    );

    expect(container.querySelector("[role='group']")?.getAttribute("data-orientation")).toBe(
      "vertical",
    );
    expect(container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  });
});
