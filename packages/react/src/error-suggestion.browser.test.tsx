import { act } from "react";
import { userEvent } from "vitest/browser";
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
import { cleanupRoots, render } from "../test/render.js";

// WCAG 3.3.3 in a real browser: following an ErrorSummary link is fragment navigation, which
// jsdom does not perform, so error-suggestion.screen-reader.test.tsx cannot show focus moving.

const message = "Enter an email address like name@example.com";

describe("ErrorSummary link", () => {
  afterEach(cleanupRoots);

  it("moves focus to the invalid field, whose description is the error", async () => {
    const { container } = render(
      <form>
        <ErrorSummary>
          <ErrorSummaryTitle>There is a problem</ErrorSummaryTitle>
          <ErrorSummaryList>
            <li>
              <ErrorSummaryLink href="#error-suggestion-email">{message}</ErrorSummaryLink>
            </li>
          </ErrorSummaryList>
        </ErrorSummary>
        <TextField id="error-suggestion-email" invalid>
          <Label>Email</Label>
          <Input name="email" type="email" />
          <FieldError>{message}</FieldError>
        </TextField>
      </form>,
    );

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(container.querySelector("a"));
    await act(async () => userEvent.keyboard("{Enter}"));

    const input = container.querySelector("input")!;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const description = input
      .getAttribute("aria-describedby")!
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    expect(description).toBe(message);
  });
});
