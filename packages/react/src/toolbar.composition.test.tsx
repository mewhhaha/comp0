import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { ToggleButton } from "./components/ToggleButton.js";
import { ToggleButtonGroup } from "./components/ToggleButtonGroup.js";
import { Toolbar } from "./components/Toolbar.js";

function renderToolbar(props: { orientation?: "horizontal" | "vertical" } = {}) {
  const result = render(
    <Toolbar aria-label="Text formatting" {...props}>
      <button type="button">Cut</button>
      <button type="button" disabled>
        Copy
      </button>
      <button type="button">Paste</button>
      <button type="button">Find</button>
    </Toolbar>,
  );
  const toolbar = result.container.querySelector<HTMLElement>("[role='toolbar']")!;
  const buttons = [...result.container.querySelectorAll<HTMLButtonElement>("button")];
  return { ...result, toolbar, buttons };
}

describe("toolbar composition", () => {
  it("renders role toolbar with orientation attributes and one tab stop", () => {
    const { toolbar, buttons } = renderToolbar();
    expect(toolbar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(toolbar.getAttribute("data-orientation")).toBe("horizontal");
    expect(buttons[0]!.tabIndex).toBe(0);
    expect(buttons[2]!.tabIndex).toBe(-1);
    expect(buttons[3]!.tabIndex).toBe(-1);
  });

  it("roves with arrows over enabled controls, skipping disabled, without looping", () => {
    const { buttons } = renderToolbar();
    buttons[0]!.focus();
    fireKeyDown(buttons[0]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]!.tabIndex).toBe(0);
    expect(buttons[0]!.tabIndex).toBe(-1);
    fireKeyDown(buttons[2]!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(buttons[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(buttons[0]!, "End");
    expect(document.activeElement).toBe(buttons[3]);
    fireKeyDown(buttons[3]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[3]);
    fireKeyDown(buttons[3]!, "Home");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(buttons[0]!, "ArrowDown");
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("uses ArrowDown and ArrowUp when vertical", () => {
    const { toolbar, buttons } = renderToolbar({ orientation: "vertical" });
    expect(toolbar.getAttribute("aria-orientation")).toBe("vertical");
    expect(toolbar.getAttribute("data-orientation")).toBe("vertical");
    buttons[0]!.focus();
    fireKeyDown(buttons[0]!, "ArrowDown");
    expect(document.activeElement).toBe(buttons[2]);
    fireKeyDown(buttons[2]!, "ArrowUp");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(buttons[0]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("roves through toggle buttons inside a nested group", () => {
    const { container } = render(
      <Toolbar aria-label="Text formatting">
        <ToggleButtonGroup type="multiple" aria-label="Text style">
          <ToggleButton value="bold">Bold</ToggleButton>
          <ToggleButton value="italic">Italic</ToggleButton>
        </ToggleButtonGroup>
        <button type="button">Clear formatting</button>
      </Toolbar>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons[0]!.tabIndex).toBe(0);
    expect(buttons[1]!.tabIndex).toBe(-1);
    expect(buttons[2]!.tabIndex).toBe(-1);
    buttons[0]!.focus();
    fireKeyDown(buttons[0]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[1]);
    fireKeyDown(buttons[1]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[2]);
  });

  it("leaves nested composites to handle their own keys and tab stops", () => {
    const { container } = render(
      <Toolbar aria-label="Text formatting">
        <button type="button">Cut</button>
        <div role="listbox" aria-label="Fonts">
          <button type="button" tabIndex={0}>
            Serif
          </button>
        </div>
      </Toolbar>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons[1]!.tabIndex).toBe(0);
    buttons[1]!.focus();
    fireKeyDown(buttons[1]!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[1]);
  });
});

describe("toggle button group selection", () => {
  it("selects one value at a time in single mode and allows deselecting", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleButtonGroup type="single" defaultValue="left" onChange={onChange} aria-label="Align">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0]!.dataset["selected"]).toBe("");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");

    fireClick(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith("center");
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[0]!.dataset["selected"]).toBeUndefined();
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");

    fireClick(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles values independently in multiple mode", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleButtonGroup
        type="multiple"
        defaultValue={["bold"]}
        onChange={onChange}
        aria-label="Text style"
      >
        <ToggleButton value="bold">Bold</ToggleButton>
        <ToggleButton value="italic">Italic</ToggleButton>
      </ToggleButtonGroup>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");

    fireClick(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["bold", "italic"]);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");

    fireClick(buttons[0]!);
    expect(onChange).toHaveBeenLastCalledWith(["italic"]);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("respects a controlled group value", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <ToggleButtonGroup type="single" value="left" onChange={onChange} aria-label="Align">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    fireClick(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith("center");
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    rerender(
      <ToggleButtonGroup type="single" value="center" onChange={onChange} aria-label="Align">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps toggle buttons standalone when the group does not manage selection", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleButtonGroup aria-label="Formatting">
        <ToggleButton value="bold" defaultSelected onChange={onChange}>
          Bold
        </ToggleButton>
      </ToggleButtonGroup>,
    );
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireClick(button);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps a lone toggle button working without any group", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleButton defaultSelected onChange={onChange}>
        Pin note
      </ToggleButton>,
    );
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireClick(button);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
