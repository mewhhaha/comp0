import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import {
  Label,
  ListBox,
  ListBoxItem,
  MentionField,
  MentionFieldInput,
  MentionFieldPopover,
} from "./index.js";

describe("MentionField browser interactions", () => {
  it("keeps the first filtered mention active after the query changes", async () => {
    const { unmount } = render(
      <MentionField as="div" defaultValue="Could @">
        <MentionFieldInput
          aria-label="Message"
          style={{ display: "block", font: "16px/24px sans-serif", padding: 12, width: 320 }}
        />
        <MentionFieldPopover style={{ width: 180 }}>
          <ListBox aria-label="Teammates">
            <ListBoxItem value="Aisha">Aisha</ListBoxItem>
            <ListBoxItem value="Diego">Diego</ListBoxItem>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = page.getByLabelText("Message", { exact: true }).element() as HTMLTextAreaElement;

    await act(async () => userEvent.click(input));
    await act(async () => userEvent.keyboard("a"));
    const firstMention = page.getByRole("option", { name: "Aisha" }).element();
    await vi.waitFor(() => expect(firstMention.hasAttribute("data-active")).toBe(true));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 100)));

    expect(input.getAttribute("aria-activedescendant")).toBe(firstMention.id);
    expect(firstMention.hasAttribute("data-active")).toBe(true);
    unmount();
  });

  it("positions suggestions at an earlier caret and retains textarea focus after insertion", async () => {
    const { unmount } = render(
      <MentionField as="div" defaultValue="Ask @Mi, then review the draft">
        <Label>Message</Label>
        <MentionFieldInput
          style={{ display: "block", font: "16px/24px sans-serif", padding: 12, width: 320 }}
        />
        <MentionFieldPopover style={{ width: 180 }}>
          <ListBox aria-label="Teammates">
            <ListBoxItem value="Mina">Mina</ListBoxItem>
            <ListBoxItem value="Misha">Misha</ListBoxItem>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );
    const input = page.getByLabelText("Message", { exact: true }).element() as HTMLTextAreaElement;
    const listBox = page.getByRole("listbox", { name: "Teammates" });

    await act(async () => userEvent.click(input));
    act(() => {
      input.setSelectionRange(7, 7);
      input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "ArrowLeft" }));
    });
    await vi.waitFor(() =>
      expect(listBox.element().parentElement?.matches(":popover-open")).toBe(true),
    );

    const popover = listBox.element().parentElement!;
    const inputRect = input.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    expect(popoverRect.left).toBeGreaterThanOrEqual(inputRect.left);
    expect(popoverRect.top).toBeGreaterThan(inputRect.top);
    expect(popoverRect.top).toBeLessThan(inputRect.bottom);
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBe(
      page.getByRole("option", { name: "Mina" }).element().id,
    );

    await act(async () => userEvent.keyboard("{Enter}"));

    expect(input.value).toBe("Ask @Mina, then review the draft");
    expect(input.selectionStart).toBe(9);
    expect(document.activeElement).toBe(input);
    expect(popover.matches(":popover-open")).toBe(false);
    unmount();
  });
});
