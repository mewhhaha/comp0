import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Editable } from "./components/Editable.js";
import { EditableInput } from "./components/EditableInput.js";
import { EditableView } from "./components/EditableView.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
  });
}

describe("editable composition", () => {
  it("shows the committed value and swaps to a focused, selected input on click", () => {
    const { container } = render(
      <Editable defaultValue="Quarterly report">
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    expect(view.textContent).toBe("Quarterly report");
    expect(view.hasAttribute("hidden")).toBe(false);
    expect(input.hasAttribute("hidden")).toBe(true);

    fireClick(view);

    expect(view.hasAttribute("hidden")).toBe(true);
    expect(input.hasAttribute("hidden")).toBe(false);
    expect(input.hasAttribute("data-editing")).toBe(true);
    expect(input.value).toBe("Quarterly report");
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Quarterly report".length);
  });

  it("commits the draft on Enter, firing onChange once and refocusing the view", () => {
    const changed = vi.fn();
    const { container } = render(
      <Editable defaultValue="Draft" onChange={changed}>
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    fireClick(view);
    fireInput(input, "Final");
    expect(changed).not.toHaveBeenCalled();

    fireKeyDown(input, "Enter");

    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith("Final");
    expect(view.textContent).toBe("Final");
    expect(input.hasAttribute("hidden")).toBe(true);
    expect(document.activeElement).toBe(view);
  });

  it("cancels on Escape, restoring the committed value without firing onChange", () => {
    const changed = vi.fn();
    const { container } = render(
      <Editable defaultValue="Draft" onChange={changed}>
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    fireClick(view);
    fireInput(input, "Scratch");
    fireKeyDown(input, "Escape");

    expect(changed).not.toHaveBeenCalled();
    expect(view.textContent).toBe("Draft");
    expect(input.value).toBe("Draft");
    expect(view.hasAttribute("hidden")).toBe(false);
  });

  it("commits the draft when focus leaves the input without stealing focus back", () => {
    const changed = vi.fn();
    const { container } = render(
      <div>
        <Editable defaultValue="Draft" onChange={changed}>
          <EditableView />
          <EditableInput aria-label="Document title" />
        </Editable>
        <input aria-label="Outside" />
      </div>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector<HTMLInputElement>("[aria-label='Document title']")!;
    const outside = container.querySelector<HTMLInputElement>("[aria-label='Outside']")!;

    fireClick(view);
    fireInput(input, "Blurred");
    act(() => outside.focus());

    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith("Blurred");
    expect(view.textContent).toBe("Blurred");
    expect(document.activeElement).toBe(outside);
  });

  it("submits the committed value through the always-present named input", () => {
    const { container } = render(
      <form>
        <Editable defaultValue="Quarterly report">
          <EditableView />
          <EditableInput name="title" aria-label="Document title" />
        </Editable>
      </form>,
    );
    const form = container.querySelector("form")!;
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    expect(new FormData(form).get("title")).toBe("Quarterly report");

    fireClick(view);
    fireInput(input, "Annual report");
    fireKeyDown(input, "Enter");

    expect(new FormData(form).get("title")).toBe("Annual report");
  });

  it("blocks entering edit mode while disabled", () => {
    const { container } = render(
      <Editable defaultValue="Locked" disabled>
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    expect(view.hasAttribute("disabled")).toBe(true);
    expect(view.hasAttribute("data-disabled")).toBe(true);
    expect(input.hasAttribute("data-disabled")).toBe(true);

    fireClick(view);

    expect(input.hasAttribute("hidden")).toBe(true);
    expect(view.hasAttribute("data-editing")).toBe(false);
  });

  it("marks an empty committed value so a placeholder can be styled", () => {
    const { container } = render(
      <Editable defaultValue="">
        <EditableView>{({ value }) => value || "Untitled"}</EditableView>
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;

    expect(view.hasAttribute("data-empty")).toBe(true);
    expect(view.textContent).toBe("Untitled");
  });

  it("reports parts rendered outside Editable", () => {
    expect(() => render(<EditableView />)).toThrow(
      "EditableView must be rendered inside Editable.",
    );
    expect(() => render(<EditableInput />)).toThrow(
      "EditableInput must be rendered inside Editable.",
    );
  });
});
