import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Editable } from "./Editable.js";
import { EditableInput } from "./EditableInput.js";
import { EditableView } from "./EditableView.js";

describe("editable composition", () => {
  it("shows the committed value and swaps to a focused, selected input on click", async () => {
    const { container, user } = setup(
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

    await user.click(view);

    expect(view.hasAttribute("hidden")).toBe(true);
    expect(input.hasAttribute("hidden")).toBe(false);
    expect(input.hasAttribute("data-open")).toBe(true);
    expect(input.value).toBe("Quarterly report");
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("Quarterly report".length);
  });

  it("commits the draft on Enter, firing onChange once and refocusing the view", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <Editable defaultValue="Draft" onChange={changed}>
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    await user.click(view);
    await user.keyboard("Final");
    expect(changed).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");

    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith("Final");
    expect(view.textContent).toBe("Final");
    expect(input.hasAttribute("hidden")).toBe(true);
    expect(document.activeElement).toBe(view);
  });

  it("cancels on Escape, restoring the committed value without firing onChange", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <Editable defaultValue="Draft" onChange={changed}>
        <EditableView />
        <EditableInput aria-label="Document title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    await user.click(view);
    await user.keyboard("Scratch");
    await user.keyboard("{Escape}");

    expect(changed).not.toHaveBeenCalled();
    expect(view.textContent).toBe("Draft");
    expect(input.value).toBe("Draft");
    expect(view.hasAttribute("hidden")).toBe(false);
  });

  it("commits the draft when focus leaves the input without stealing focus back", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <div>
        <Editable defaultValue="Draft" onChange={changed}>
          <EditableView />
          <EditableInput aria-label="Document title" />
        </Editable>
        <input aria-label="Outside" />
      </div>,
    );
    const view = container.querySelector("button")!;
    const outside = container.querySelector<HTMLInputElement>("[aria-label='Outside']")!;

    await user.click(view);
    await user.keyboard("Blurred");
    await user.click(outside);

    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledWith("Blurred");
    expect(view.textContent).toBe("Blurred");
    expect(document.activeElement).toBe(outside);
  });

  it("submits the committed value through the always-present named input", async () => {
    const { container, user } = setup(
      <form>
        <Editable defaultValue="Quarterly report">
          <EditableView />
          <EditableInput name="title" aria-label="Document title" />
        </Editable>
      </form>,
    );
    const form = container.querySelector("form")!;
    const view = container.querySelector("button")!;

    expect(new FormData(form).get("title")).toBe("Quarterly report");

    await user.click(view);
    await user.keyboard("Annual report");
    await user.keyboard("{Enter}");

    expect(new FormData(form).get("title")).toBe("Annual report");
  });

  it("blocks entering edit mode while disabled", async () => {
    const { container, user } = setup(
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

    await user.click(view);

    expect(input.hasAttribute("hidden")).toBe(true);
    expect(view.hasAttribute("data-open")).toBe(false);
  });

  it("marks an empty committed value so a placeholder can be styled", async () => {
    const { container } = render(
      <Editable defaultValue="">
        <EditableView>Untitled</EditableView>
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

  it("reports edit mode through open and onOpenChange and exposes data-open", async () => {
    const toggled = vi.fn();
    const { container, rerender, user } = setup(
      <Editable defaultValue="Draft" open={false} onOpenChange={toggled}>
        <EditableView />
        <EditableInput aria-label="Title" />
      </Editable>,
    );
    const view = container.querySelector("button")!;
    const input = container.querySelector("input")!;

    await user.click(view);
    expect(toggled).toHaveBeenLastCalledWith(true);
    expect(input.hasAttribute("hidden")).toBe(true);
    expect(view.hasAttribute("data-open")).toBe(false);

    rerender(
      <Editable defaultValue="Draft" open onOpenChange={toggled}>
        <EditableView />
        <EditableInput aria-label="Title" />
      </Editable>,
    );
    expect(input.hasAttribute("hidden")).toBe(false);
    expect(input.hasAttribute("data-open")).toBe(true);
  });
});
