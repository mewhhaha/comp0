import { act } from "react";
import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { Label, PasswordField, PasswordFieldInput, PasswordFieldToggle } from "./index.js";

describe("password field browser interactions", () => {
  it("uses native pointer focus while revealing the same input", async () => {
    const { unmount } = render(
      <form>
        <PasswordField defaultValue="correct horse">
          <Label>Password</Label>
          <PasswordFieldInput />
          <PasswordFieldToggle />
        </PasswordField>
      </form>,
    );
    const input = page.getByLabelText("Password", { exact: true }).element() as HTMLInputElement;
    const toggle = page.getByRole("button", { name: "Show password" });
    const toggleElement = toggle.element() as HTMLButtonElement;

    act(() => {
      input.focus();
      input.setSelectionRange(3, 7, "forward");
    });
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
    await act(async () => toggle.click());
    await act(async () => new Promise(requestAnimationFrame));

    expect(document.activeElement).toBe(toggleElement);
    expect(page.getByLabelText("Password", { exact: true }).element()).toBe(input);
    expect(input.type).toBe("text");
    expect(input.value).toBe("correct horse");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
    expect(toggleElement.type).toBe("button");
    unmount();
  });
});
