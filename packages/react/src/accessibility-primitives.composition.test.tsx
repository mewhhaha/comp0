import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Alert } from "./components/Alert.js";
import { CharacterCount } from "./components/CharacterCount.js";
import { ErrorSummary } from "./components/ErrorSummary.js";
import { ErrorSummaryLink } from "./components/ErrorSummaryLink.js";
import { ErrorSummaryList } from "./components/ErrorSummaryList.js";
import { ErrorSummaryTitle } from "./components/ErrorSummaryTitle.js";
import { Input } from "./components/Input.js";
import { KeybindingHint } from "./components/KeybindingHint.js";
import { Status } from "./components/Status.js";
import { TextField } from "./components/TextField.js";

describe("accessibility feedback primitives", () => {
  it("distinguishes urgent alerts from polite status messages", () => {
    const { getByRole } = render(
      <>
        <Alert>Payment failed.</Alert>
        <Status>Draft saved.</Status>
      </>,
    );

    expect(getByRole("alert").textContent).toBe("Payment failed.");
    expect(getByRole("status").textContent).toBe("Draft saved.");
  });

  it("focuses an error summary and links each message to its field", () => {
    const { getByRole } = render(
      <ErrorSummary>
        <ErrorSummaryTitle>There is a problem</ErrorSummaryTitle>
        <ErrorSummaryList>
          <li>
            <ErrorSummaryLink href="#email">Enter an email address</ErrorSummaryLink>
          </li>
        </ErrorSummaryList>
      </ErrorSummary>,
    );
    const summary = getByRole("alert", { name: "There is a problem" });

    expect(document.activeElement).toBe(summary);
    expect(getByRole("link", { name: "Enter an email address" }).getAttribute("href")).toBe(
      "#email",
    );
  });

  it("counts the field value and participates in its description", () => {
    const { getByRole } = render(
      <TextField id="message" defaultValue="Hello">
        <Input maxLength={10} />
        <CharacterCount maxLength={10}>{({ remaining }) => `${remaining} left`}</CharacterCount>
      </TextField>,
    );
    const input = getByRole("textbox");
    const status = getByRole("status");

    expect(status.textContent).toBe("5 left");
    expect(status.getAttribute("for")).toBe("message");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(status.id);

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "Hello you");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(status.textContent).toBe("1 left");
    expect(status.getAttribute("data-remaining")).toBe("1");
  });

  it("rejects an invalid character limit with the received value", () => {
    expect(() =>
      render(
        <TextField defaultValue="">
          <CharacterCount maxLength={-1} />
        </TextField>,
      ),
    ).toThrow("CharacterCount maxLength must be a non-negative integer; received -1.");
  });

  it("requires observable TextField state", () => {
    expect(() =>
      render(
        <TextField>
          <CharacterCount maxLength={10} />
        </TextField>,
      ),
    ).toThrow(
      "CharacterCount requires TextField value, defaultValue, or onChange so it can observe the text.",
    );
  });

  it("renders keyboard chords as visible keys with one spoken label", () => {
    const { getByLabelText } = render(<KeybindingHint keys="Mod+Shift+P" />);
    const hint = getByLabelText("Control plus Shift plus P");

    expect([...hint.querySelectorAll("kbd")].map((key) => key.textContent)).toEqual([
      "Ctrl",
      "Shift",
      "P",
    ]);
  });

  it("renders Mod as Command on Apple platforms", () => {
    const userAgent = vi
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    try {
      const { getByLabelText } = render(<KeybindingHint keys="Mod+K" />);
      const hint = getByLabelText("Command plus K");
      expect(hint.querySelector("kbd")?.textContent).toBe("⌘");
    } finally {
      userAgent.mockRestore();
    }
  });
});
