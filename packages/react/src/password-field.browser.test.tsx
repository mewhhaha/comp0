import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { PasswordField, PasswordFieldInput, PasswordFieldToggle } from "./index.js";

describe("password field browser interactions", () => {
  it("uses native pointer focus while revealing the same input", async () => {
    const { container, unmount } = render(
      <form>
        <PasswordField defaultValue="correct horse">
          <PasswordFieldInput />
          <PasswordFieldToggle />
        </PasswordField>
      </form>,
    );
    const input = container.querySelector("input")!;
    const toggle = container.querySelector("button")!;

    act(() => {
      input.focus();
      input.setSelectionRange(3, 7, "forward");
    });
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
    await act(async () => userEvent.click(toggle));
    await act(async () => new Promise(requestAnimationFrame));

    expect(document.activeElement).toBe(toggle);
    expect(container.querySelector("input")).toBe(input);
    expect(input.type).toBe("text");
    expect(input.value).toBe("correct horse");
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
    expect(toggle.type).toBe("button");
    unmount();
  });
});
