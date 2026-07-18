import { act, Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import {
  Label,
  ListBox,
  ListBoxItem,
  MentionField,
  MentionFieldInput,
  MentionFieldPopover,
} from "./index.js";

function fireInput(input: HTMLTextAreaElement, value: string, caret = value.length) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: value,
        inputType: "insertText",
      }),
    );
  });
}

function moveCaret(input: HTMLTextAreaElement, caret: number) {
  act(() => {
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "ArrowLeft" }));
  });
}

function Composer({ onChange = () => undefined }: { onChange?: (value: string) => void }) {
  return (
    <MentionField
      defaultValue=""
      filter={(label, query) => label.startsWith(query)}
      onChange={onChange}
    >
      <Label>Message</Label>
      <MentionFieldInput />
      <MentionFieldPopover>
        <ListBox aria-label="Teammates">
          <ListBoxItem value="Aisha">Aisha</ListBoxItem>
          <ListBoxItem value="Diego">Diego</ListBoxItem>
        </ListBox>
      </MentionFieldPopover>
    </MentionField>
  );
}

describe("MentionField composition", () => {
  it("adds no wrapper unless a root element is requested", () => {
    const { container } = render(
      <MentionField as={Fragment} defaultValue="">
        <MentionFieldInput aria-label="Message" />
        <MentionFieldPopover>
          <ListBox aria-label="Teammates" />
        </MentionFieldPopover>
      </MentionField>,
    );

    expect(container.children).toHaveLength(2);
    expect(container.firstElementChild?.tagName).toBe("TEXTAREA");
    expect(container.querySelector("[popover]")?.hasAttribute("role")).toBe(false);
    expect(container.querySelector("[popover] > [role='listbox']")).not.toBeNull();
  });

  it("filters the active token and inserts the keyboard-active mention", () => {
    const changed = vi.fn();
    const { container } = render(<Composer onChange={changed} />);
    const input = container.querySelector("textarea")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;
    const listBox = popover.querySelector<HTMLElement>("[role='listbox']")!;

    input.focus();
    fireInput(input, "Ask @Ai");

    expect(popover.hidden, "suggestions open").toBe(false);
    expect(input.hasAttribute("data-mention-active"), "input exposes active token").toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe(listBox.id);
    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(input.getAttribute("aria-activedescendant")).toBe(
      container.querySelector("[role='option']")?.id,
    );

    fireKeyDown(input, "Enter");

    expect(changed).toHaveBeenLastCalledWith("Ask @Aisha ");
    expect(input.value).toBe("Ask @Aisha ");
    expect(input.selectionStart).toBe(11);
    expect(popover.dataset.trigger, "active trigger clears after insertion").toBeUndefined();
    expect(popover.hidden, "suggestions close after insertion").toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("replaces a mention at the caret without changing surrounding text", () => {
    const { container } = render(
      <MentionField defaultValue="Ask @Mi, about shipping">
        <Label>Message</Label>
        <MentionFieldInput />
        <MentionFieldPopover>
          <ListBox>
            <ListBoxItem value="Mina">Mina</ListBoxItem>
            <ListBoxItem value="Misha">Misha</ListBoxItem>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = container.querySelector("textarea")!;
    const mina = container.querySelector<HTMLElement>("[data-value='Mina']")!;

    input.focus();
    moveCaret(input, 7);
    fireClick(mina);

    expect(input.value).toBe("Ask @Mina, about shipping");
    expect(input.selectionStart).toBe(9);
  });

  it("supports multiple triggers and ignores trigger characters inside words", () => {
    const { container } = render(
      <MentionField defaultValue="" triggers={["@", "#"]}>
        <MentionFieldInput aria-label="Message" />
        <MentionFieldPopover>
          <ListBox aria-label="Suggestions">
            <ListBoxItem value="release">release</ListBoxItem>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = container.querySelector("textarea")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;

    input.focus();
    fireInput(input, "Track #rel");
    expect(popover.dataset.trigger).toBe("#");

    fireInput(input, "mail@example");
    expect(popover.hidden).toBe(true);
  });

  it("dismisses suggestions with Escape without changing the message", () => {
    const { container } = render(<Composer />);
    const input = container.querySelector("textarea")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;

    input.focus();
    fireInput(input, "Ask @");
    fireKeyDown(input, "Escape");

    expect(input.value).toBe("Ask @");
    expect(popover.dataset.trigger, "active trigger clears on Escape").toBeUndefined();
    expect(popover.hidden, "suggestions close on Escape").toBe(true);
    expect(input.hasAttribute("aria-activedescendant"), "virtual focus clears").toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("restores the initial message when its form resets", async () => {
    const { container } = render(
      <form>
        <MentionField defaultValue="Ask @Mina">
          <MentionFieldInput name="message" />
          <MentionFieldPopover>
            <ListBox aria-label="Teammates" />
          </MentionFieldPopover>
        </MentionField>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector("textarea")!;

    fireInput(input, "Ask @Diego");
    await act(async () => {
      form.reset();
      await Promise.resolve();
    });

    expect(input.value).toBe("Ask @Mina");
  });

  it("rejects empty and whitespace triggers with the failing value", () => {
    expect(() =>
      render(
        <MentionField triggers={[" "]}>
          <MentionFieldInput aria-label="Message" />
        </MentionField>,
      ),
    ).toThrow('MentionField trigger " " must be non-empty and contain no whitespace.');
  });
});
