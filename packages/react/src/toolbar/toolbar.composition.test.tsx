import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { ToggleButton } from "../toggle-button/ToggleButton.js";
import { ToggleButtonGroup } from "../toggle-button/ToggleButtonGroup.js";
import { Toolbar } from "./Toolbar.js";
import { Link } from "../link/Link.js";

function renderToolbar(props: { orientation?: "horizontal" | "vertical" } = {}) {
  const result = setup(
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
  it("renders role toolbar with orientation attributes and one tab stop", async () => {
    const { toolbar, buttons } = renderToolbar();
    expect(toolbar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(toolbar.getAttribute("data-orientation")).toBe("horizontal");
    expect(buttons[0]!.tabIndex).toBe(0);
    expect(buttons[2]!.tabIndex).toBe(-1);
    expect(buttons[3]!.tabIndex).toBe(-1);
  });

  it("roves with arrows over enabled controls, skipping disabled, without looping", async () => {
    const { buttons, user } = renderToolbar();
    buttons[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]!.tabIndex).toBe(0);
    expect(buttons[0]!.tabIndex).toBe(-1);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(buttons[3]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[3]);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("uses ArrowDown and ArrowUp when vertical", async () => {
    const { toolbar, buttons, user } = renderToolbar({ orientation: "vertical" });
    expect(toolbar.getAttribute("aria-orientation")).toBe("vertical");
    expect(toolbar.getAttribute("data-orientation")).toBe("vertical");
    buttons[0]!.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons[2]);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("roves through toggle buttons inside a nested group", async () => {
    const { container, user } = setup(
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
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[1]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[2]);
  });

  it("leaves nested composites to handle their own keys and tab stops", async () => {
    const { container, user } = setup(
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
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("excludes aria-disabled polymorphic controls from the roving tab stop", () => {
    const { container } = setup(
      <Toolbar aria-label="Actions">
        <Link href="/archive" disabled>
          Archive
        </Link>
        <button type="button">Delete</button>
      </Toolbar>,
    );
    const link = container.querySelector<HTMLAnchorElement>("a")!;
    const button = container.querySelector<HTMLButtonElement>("button")!;

    expect(link.tabIndex).toBe(-1);
    expect(button.tabIndex).toBe(0);
  });
});

describe("toggle button group selection", () => {
  it("selects one value at a time in single mode and allows deselecting", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <ToggleButtonGroup type="single" defaultValue="left" onChange={onChange} aria-label="Align">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0]!.dataset["selected"]).toBe("");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");

    await user.click(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith("center");
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[0]!.dataset["selected"]).toBeUndefined();
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");

    await user.click(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles values independently in multiple mode", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
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

    await user.click(buttons[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["bold", "italic"]);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");

    await user.click(buttons[0]!);
    expect(onChange).toHaveBeenLastCalledWith(["italic"]);
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("respects a controlled group value", async () => {
    const onChange = vi.fn();
    const { container, rerender, user } = setup(
      <ToggleButtonGroup type="single" value="left" onChange={onChange} aria-label="Align">
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
      </ToggleButtonGroup>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    await user.click(buttons[1]!);
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

  it("keeps toggle buttons standalone when the group does not manage selection", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <ToggleButtonGroup aria-label="Formatting">
        <ToggleButton value="bold" defaultSelected onChange={onChange}>
          Bold
        </ToggleButton>
      </ToggleButtonGroup>,
    );
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await user.click(button);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps a lone toggle button working without any group", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <ToggleButton defaultSelected onChange={onChange}>
        Pin note
      </ToggleButton>,
    );
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await user.click(button);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
