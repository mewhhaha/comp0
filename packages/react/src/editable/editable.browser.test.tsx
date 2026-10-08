import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { expectNoAxeViolations } from "../../test/axe.js";
import { Editable, EditableInput, EditableView } from "../index.js";

describe("editable browser interactions", () => {
  it("has no axe violations in view mode or while editing", async () => {
    const { container, unmount } = render(
      <Editable defaultValue="Quarterly report">
        <EditableView aria-label="Document title, press to edit" />
        <EditableInput aria-label="Document title" name="title" />
      </Editable>,
    );
    await expectNoAxeViolations(container, "editable view");

    const view = page.getByRole("button", { name: "Document title, press to edit" });
    await act(async () => userEvent.click(view.element()));
    const input = page.getByRole("textbox", { name: "Document title" }).element();

    expect(document.activeElement).toBe(input);
    await expectNoAxeViolations(container, "editable editing");
    unmount();
  });
});
