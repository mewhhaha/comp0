import { act, Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import {
  Label,
  ListBox,
  ListBoxOption,
  MentionField,
  MentionFieldInput,
  MentionFieldPopover,
} from "../index.js";

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
          <ListBoxOption value="Aisha">Aisha</ListBoxOption>
          <ListBoxOption value="Diego">Diego</ListBoxOption>
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

  it("filters the active token and inserts the keyboard-active mention", async () => {
    const changed = vi.fn();
    const { getByLabelText, getByRole, user } = setup(<Composer onChange={changed} />);
    const input = getByLabelText("Message") as HTMLTextAreaElement;
    const listBox = getByRole("listbox", { name: "Teammates", hidden: true });
    const popover = listBox.parentElement!;

    await user.click(input);
    await user.type(input, "Ask @Ai");

    expect(popover.hidden, "suggestions open").toBe(false);
    expect(input.hasAttribute("data-mention-active"), "input exposes active token").toBe(true);
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.hasAttribute("aria-expanded")).toBe(false);
    expect(input.getAttribute("aria-controls")).toBe(listBox.id);
    const option = getByRole("option", { name: "Aisha", hidden: true });
    expect(input.getAttribute("aria-activedescendant")).toBe(option.id);

    await user.keyboard("{Enter}");

    expect(changed).toHaveBeenLastCalledWith("Ask @Aisha ");
    expect(input.value).toBe("Ask @Aisha ");
    expect(input.selectionStart).toBe(11);
    expect(popover.dataset.trigger, "active trigger clears after insertion").toBeUndefined();
    expect(popover.hidden, "suggestions close after insertion").toBe(true);
  });

  it("replaces a mention at the caret without changing surrounding text", async () => {
    const { container, user } = setup(
      <MentionField defaultValue="Ask @Mi, about shipping">
        <Label>Message</Label>
        <MentionFieldInput />
        <MentionFieldPopover>
          <ListBox>
            <ListBoxOption value="Mina">Mina</ListBoxOption>
            <ListBoxOption value="Misha">Misha</ListBoxOption>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = container.querySelector("textarea")!;
    const mina = container.querySelector<HTMLElement>("[data-value='Mina']")!;

    await user.click(input);
    input.setSelectionRange(8, 8);
    await user.keyboard("{ArrowLeft}");
    await user.click(mina);

    expect(input.value).toBe("Ask @Mina, about shipping");
    expect(input.selectionStart).toBe(9);
  });

  it("supports multiple triggers and ignores trigger characters inside words", async () => {
    const { container, user } = setup(
      <MentionField defaultValue="" triggers={["@", "#"]}>
        <MentionFieldInput aria-label="Message" />
        <MentionFieldPopover>
          <ListBox aria-label="Suggestions">
            <ListBoxOption value="release">release</ListBoxOption>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = container.querySelector("textarea")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;

    await user.type(input, "Track #rel");
    expect(popover.dataset.trigger).toBe("#");

    await user.clear(input);
    await user.type(input, "mail@example");
    expect(popover.hidden).toBe(true);
  });

  it("dismisses suggestions with Escape without changing the message", async () => {
    const { container, user } = setup(<Composer />);
    const input = container.querySelector("textarea")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;

    await user.type(input, "Ask @");
    await user.keyboard("{Escape}");

    expect(input.value).toBe("Ask @");
    expect(popover.dataset.trigger, "active trigger clears on Escape").toBeUndefined();
    expect(popover.hidden, "suggestions close on Escape").toBe(true);
    expect(input.hasAttribute("aria-activedescendant"), "virtual focus clears").toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("restores the initial message when its form resets", async () => {
    const { container, user } = setup(
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

    await user.type(input, "go");
    await act(async () => {
      form.reset();
      await Promise.resolve();
    });

    expect(input.value).toBe("Ask @Mina");
  });

  it("warns about and ignores empty and whitespace triggers", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { container, user } = setup(
        <MentionField defaultValue="" triggers={[" ", "@"]}>
          <MentionFieldInput aria-label="Message" />
          <MentionFieldPopover>
            <ListBox aria-label="Suggestions">
              <ListBoxOption value="Mina">Mina</ListBoxOption>
            </ListBox>
          </MentionFieldPopover>
        </MentionField>,
      );
      const popover = container.querySelector<HTMLElement>("[popover]")!;

      expect(consoleError).toHaveBeenCalledWith(
        'MentionField trigger " " must be non-empty and contain no whitespace. It was ignored.',
      );
      await user.type(container.querySelector("textarea")!, "Hi @Mi");
      expect(popover.dataset.trigger).toBe("@");
    } finally {
      consoleError.mockRestore();
    }
  });
});
