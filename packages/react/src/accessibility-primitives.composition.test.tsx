import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Alert } from "./alert/Alert.js";
import { ErrorSummary } from "./error-summary/ErrorSummary.js";
import { ErrorSummaryLink } from "./error-summary/ErrorSummaryLink.js";
import { ErrorSummaryList } from "./error-summary/ErrorSummaryList.js";
import { ErrorSummaryTitle } from "./error-summary/ErrorSummaryTitle.js";
import { KeybindingHint } from "./keybinding-hint/KeybindingHint.js";
import { Status } from "./status/Status.js";

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
