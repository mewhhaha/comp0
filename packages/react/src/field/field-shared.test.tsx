import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Description } from "./Description.js";
import { FieldError } from "./FieldError.js";
import { describedBy, fieldFeedback, useFieldIds, type FieldContextValue } from "./field-shared.js";
import { CharacterCount } from "../character-count/CharacterCount.js";

function context(overrides: Partial<FieldContextValue> = {}): FieldContextValue {
  return {
    controlId: "name",
    labelId: "name-label",
    descriptionId: "name-description",
    errorId: "name-error",
    characterCountId: "name-character-count",
    ...overrides,
  };
}

describe("useFieldIds", () => {
  it("derives every id from an explicit control id", () => {
    const { result } = renderHook(() => useFieldIds("email"));

    expect(result.current).toEqual({
      controlId: "email",
      labelId: "email-label",
      descriptionId: "email-description",
      errorId: "email-error",
      characterCountId: "email-character-count",
    });
  });

  it("generates a stable id when none is given", () => {
    const { result, rerender } = renderHook(() => useFieldIds(undefined));
    const first = result.current.controlId;

    rerender();
    expect(first).toMatch(/^comp0-/);
    expect(result.current.controlId).toBe(first);
    expect(result.current.errorId).toBe(`${first}-error`);
  });
});

describe("fieldFeedback", () => {
  it("finds declaratively rendered feedback, including nested parts", () => {
    const feedback = fieldFeedback(
      <div>
        <Description>Hint</Description>
        <span>
          <CharacterCount maxLength={10} />
        </span>
      </div>,
    );

    expect(feedback).toEqual({
      descriptionMounted: true,
      errorMounted: false,
      characterCountMounted: true,
    });
  });

  it("counts an error only while the field is invalid or the error is forced", () => {
    const error = <FieldError>Bad</FieldError>;

    expect(fieldFeedback(error).errorMounted).toBe(false);
    expect(fieldFeedback(error, true).errorMounted).toBe(true);
    expect(fieldFeedback(<FieldError forceMount>Bad</FieldError>).errorMounted).toBe(true);
  });

  it("finds nothing in plain content", () => {
    expect(fieldFeedback("text")).toEqual({
      descriptionMounted: false,
      errorMounted: false,
      characterCountMounted: false,
    });
  });
});

describe("describedBy", () => {
  it("is empty without a field", () => {
    expect(describedBy(null)).toBe("");
    expect(describedBy(null, "extra")).toBe("extra");
  });

  it("lists the caller's ids, then description, error, and count that are mounted", () => {
    const field = context({
      descriptionMounted: true,
      errorMounted: true,
      characterCountMounted: true,
      invalid: true,
    });

    expect(describedBy(field, "hint")).toBe(
      "hint name-description name-error name-character-count",
    );
  });

  it("skips the error until the field is invalid and the description until mounted", () => {
    expect(describedBy(context({ errorMounted: true }))).toBe("");
    expect(describedBy(context({ descriptionMounted: true }))).toBe("name-description");
    expect(describedBy(context({ errorMounted: true, invalid: true }))).toBe("name-error");
  });
});
