import { act, createRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Description } from "../field/Description.js";
import { FieldError } from "../field/FieldError.js";
import { Label } from "../field/Label.js";
import { PasswordField } from "./PasswordField.js";
import { PasswordFieldInput } from "./PasswordFieldInput.js";
import { PasswordFieldToggle } from "./PasswordFieldToggle.js";

describe("password field composition", () => {
  it("inherits field semantics and forwards native password input behavior", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <PasswordField
        id="account-password"
        defaultValue="initial"
        invalid
        required
        onChange={changed}
      >
        <Label>Password</Label>
        <Description>At least twelve characters</Description>
        <PasswordFieldInput name="password" autoComplete="new-password" />
        <FieldError>Password is too short</FieldError>
        <PasswordFieldToggle />
      </PasswordField>,
    );
    const input = container.querySelector("input")!;

    expect(input.id).toBe("account-password");
    expect(input.type).toBe("password");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "account-password-description account-password-error",
    );
    expect(input.autocomplete).toBe("new-password");
    expect(input.getAttribute("spellcheck")).toBe("false");
    expect(input.getAttribute("autocapitalize")).toBe("none");
    expect(container.querySelector("label")?.htmlFor).toBe("account-password");

    await user.clear(input);
    await user.type(input, "replacement");
    expect(input.value).toBe("replacement");
    expect(changed).toHaveBeenLastCalledWith("replacement");
  });

  it("reveals one stable input without losing its value, focus, or caret", async () => {
    const inputRef = createRef<HTMLInputElement>();
    const { container, user } = setup(
      <PasswordField id="field-password" defaultValue="correct horse">
        <PasswordFieldInput id="password" ref={inputRef} />
        <PasswordFieldToggle>Reveal</PasswordFieldToggle>
      </PasswordField>,
    );
    const input = inputRef.current!;
    const toggle = container.querySelector("button")!;

    await user.click(input);
    act(() => input.setSelectionRange(3, 7, "forward"));
    expect(toggle.type).toBe("button");
    expect(toggle.getAttribute("aria-label")).toBe("Show password");
    expect(toggle.getAttribute("aria-controls")).toBe("password");
    expect(toggle.hasAttribute("aria-pressed")).toBe(false);
    expect(toggle.hasAttribute("data-visible")).toBe(false);
    expect(toggle.textContent).toBe("Reveal");
    expect(container.querySelector("output")?.textContent).toBe("");

    await user.click(toggle);

    expect(container.querySelector("input")).toBe(input);
    expect(input.type).toBe("text");
    expect(input.value).toBe("correct horse");
    expect(document.activeElement).toBe(toggle);
    expect(input.selectionStart).toBe(3);
    expect(input.selectionEnd).toBe(7);
    expect(toggle.getAttribute("aria-label")).toBe("Hide password");
    expect(toggle.hasAttribute("data-visible")).toBe(true);
    expect(toggle.textContent).toBe("Reveal");
    expect(input.hasAttribute("data-visible")).toBe(true);
    expect(container.querySelector("output")?.textContent).toBe("Your password is visible.");

    await user.click(toggle);
    expect(container.querySelector("input")).toBe(input);
    expect(input.type).toBe("password");
    expect(container.querySelector("output")?.textContent).toBe("Your password is hidden.");
  });

  it("shares disabled state with the toggle", async () => {
    const { container, user } = setup(
      <PasswordField disabled>
        <PasswordFieldInput />
        <PasswordFieldToggle />
      </PasswordField>,
    );
    const input = container.querySelector("input")!;
    const toggle = container.querySelector("button")!;

    expect(input.disabled).toBe(true);
    expect(toggle.disabled).toBe(true);
    expect(toggle.hasAttribute("data-disabled")).toBe(true);
    await user.click(toggle);
    expect(input.type).toBe("password");
  });

  it("supports localized labels and announcements while respecting cancelled clicks", async () => {
    let cancelToggle = true;
    const { container, user } = setup(
      <PasswordField
        visibleAnnouncement="The account password is visible."
        hiddenAnnouncement="The account password is hidden."
      >
        <PasswordFieldInput />
        <PasswordFieldToggle
          showLabel="Show account password"
          hideLabel="Hide account password"
          onClick={(event) => {
            if (cancelToggle) event.preventDefault();
          }}
        />
      </PasswordField>,
    );
    const input = container.querySelector("input")!;
    const toggle = container.querySelector("button")!;

    expect(toggle.textContent).toBe("Show account password");
    await user.click(toggle);
    expect(input.type).toBe("password");
    expect(container.querySelector("output")?.textContent).toBe("");

    cancelToggle = false;
    await user.click(toggle);
    expect(input.type).toBe("text");
    expect(toggle.getAttribute("aria-label")).toBe("Hide account password");
    expect(toggle.textContent).toBe("Hide account password");
    expect(container.querySelector("output")?.textContent).toBe("The account password is visible.");
  });

  it("allows the toggle to mount before an input without crashing", async () => {
    const { container, user } = setup(
      <PasswordField>
        <PasswordFieldToggle />
      </PasswordField>,
    );
    const toggle = container.querySelector("button")!;

    expect(toggle.hasAttribute("aria-controls")).toBe(false);
    await user.click(toggle);
    expect(toggle.getAttribute("aria-label")).toBe("Hide password");
  });

  it("conceals the password when its owning form submits", async () => {
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container, user } = setup(
      <form onSubmit={submitted}>
        <PasswordField defaultValue="secret">
          <PasswordFieldInput name="password" />
          <PasswordFieldToggle />
        </PasswordField>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector("input")!;
    const toggle = container.querySelector("button")!;

    expect(toggle.type).toBe("button");
    await user.click(toggle);
    expect(submitted).not.toHaveBeenCalled();
    expect(input.type).toBe("text");
    act(() => form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true })));

    expect(submitted).toHaveBeenCalledOnce();
    expect(input.type).toBe("password");
    expect(input.value).toBe("secret");
  });

  it("conceals the password after a persisted page restore", async () => {
    const { container, user } = setup(
      <PasswordField>
        <PasswordFieldInput />
        <PasswordFieldToggle />
      </PasswordField>,
    );
    const input = container.querySelector("input")!;

    await user.click(container.querySelector("button")!);
    expect(input.type).toBe("text");
    act(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    expect(input.type).toBe("password");
  });

  it("conceals the password after a page restore in its owning document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    const { container, unmount } = render(
      <PasswordField>
        <PasswordFieldInput />
        <PasswordFieldToggle />
      </PasswordField>,
      frame.contentDocument!,
    );
    const input = container.querySelector("input")!;
    const toggle = container.querySelector("button")!;
    act(() =>
      toggle.dispatchEvent(
        new frameWindow.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );
    expect(input.type).toBe("text");

    act(() =>
      frameWindow.dispatchEvent(
        new frameWindow.PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );

    expect(input.type).toBe("password");
    unmount();
    frame.remove();
  });

  it("renders hidden on the server and adds the toggle after hydration", async () => {
    const fixture = (
      <PasswordField id="hydrated-password" defaultValue="secret">
        <PasswordFieldInput />
        <PasswordFieldToggle />
      </PasswordField>
    );
    const markup = renderToString(fixture);
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(container.querySelector("input")?.type).toBe("password");
    expect(container.querySelector("button")).toBeNull();

    const root = hydrateRoot(container, fixture);
    expect(container.querySelector("button")).toBeNull();
    await act(async () => undefined);

    expect(container.querySelector("input")?.type).toBe("password");
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe("Show password");
    expect(
      consoleError.mock.calls.some((call) => String(call[0]).toLowerCase().includes("hydration")),
    ).toBe(false);

    act(() => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });
});
