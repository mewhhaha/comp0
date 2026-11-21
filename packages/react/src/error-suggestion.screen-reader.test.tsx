import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { virtual } from "@guidepup/virtual-screen-reader";
import { afterEach, describe, expect, it } from "vitest";
import {
  ErrorSummary,
  ErrorSummaryLink,
  ErrorSummaryList,
  ErrorSummaryTitle,
  FieldError,
  Input,
  Label,
  TextField,
} from "./index.js";

// WCAG 3.3.3 Error Suggestion: the library's part is that a field's error message reaches a
// screen reader user where they are and when it appears. The wording is the consumer's; the docs
// examples' messages are checked in apps/docs/src/examples/error-messages.test.ts, and
// error-suggestion.browser.test.tsx follows an ErrorSummary link with real fragment navigation.

const message = "Enter an email address like name@example.com";

function EmailField({ invalid }: { invalid: boolean }) {
  return (
    <TextField id="email" invalid={invalid}>
      <Label>Email</Label>
      <Input name="email" type="email" />
      <FieldError>{message}</FieldError>
    </TextField>
  );
}

const page = (ui: ReactElement) => (
  <>
    <button type="button">Before</button>
    {ui}
  </>
);

let root: Root | undefined;

async function mount(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(page(ui)));
  await virtual.start({ container });
  return container;
}

async function rerender(ui: ReactElement) {
  await act(async () => root!.render(page(ui)));
}

afterEach(async () => {
  await virtual.stop();
  await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
});

describe("Field errors for a screen reader", () => {
  it("announces the error with the invalid input when focus lands on it", async () => {
    const container = await mount(<EmailField invalid />);
    await virtual.press("Tab");

    const input = container.querySelector("input")!;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(await virtual.lastSpokenPhrase()).toBe(`textbox, Email, ${message}, invalid`);
  });

  it("stops announcing the error once the field is valid", async () => {
    const container = await mount(<EmailField invalid />);
    await rerender(<EmailField invalid={false} />);
    await virtual.press("Tab");

    const input = container.querySelector("input")!;
    expect(document.activeElement).toBe(input);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(await virtual.lastSpokenPhrase()).toBe("textbox, Email");
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("exposes the error as an alert when it appears", async () => {
    await mount(<EmailField invalid={false} />);
    await virtual.press("Tab");
    await rerender(<EmailField invalid />);

    // guidepup announces changes inside an existing live region, not an inserted role="alert"
    // element (which real screen readers announce), so read the new content to confirm the
    // reader meets it as an alert carrying the message.
    await virtual.clearSpokenPhraseLog();
    for (let step = 0; step < 6; step++) await virtual.next();
    const log = await virtual.spokenPhraseLog();
    expect(log.slice(log.indexOf("alert"))).toEqual(["alert", message, "end of alert"]);
  });
});

describe("ErrorSummary for a screen reader", () => {
  it("names the fix in a link that points at the invalid field, which announces the error", async () => {
    const container = await mount(
      <form>
        <ErrorSummary>
          <ErrorSummaryTitle>There is a problem</ErrorSummaryTitle>
          <ErrorSummaryList>
            <li>
              <ErrorSummaryLink href="#email">{message}</ErrorSummaryLink>
            </li>
          </ErrorSummaryList>
        </ErrorSummary>
        <EmailField invalid />
      </form>,
    );

    // The summary takes focus when it mounts, so the next Tab reaches its link.
    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe(`link, ${message}`);
    const link = container.querySelector("a")!;
    expect(container.querySelector(link.getAttribute("href")!)).toBe(
      container.querySelector("input"),
    );

    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe(`textbox, Email, ${message}, invalid`);
  });
});
