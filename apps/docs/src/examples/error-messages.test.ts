import { describe, expect, it } from "vitest";

// WCAG 3.3.3 Error Suggestion: comp0 wires and announces error messages, but their wording is
// the consumer's. The docs examples are what consumers copy, so every FieldError and
// ErrorSummaryLink message in them must say how to fix the input, not just that it is wrong.

const sources = import.meta.glob<string>("./cases/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

/** Words that start an instruction a person can act on. */
const fixVerb =
  /\b(?:enter|choose|use|select|add|pick|type|include|remove|check|try|fill in|upload)\b/i;
/** A stated format, such as "YYYY-MM-DD", "in the format …", or "at least 8 characters". */
const statedFormat = /\b(?:format|e\.g\.|for example|at least|at most|between|YYYY|MM|DD)\b/;

/** Returns why `text` does not suggest a fix, or `undefined` when it does. */
function errorMessageProblem(text: string): string | undefined {
  if (text.includes("{")) return "message is an expression; write it in the example";
  if (!fixVerb.test(text) && !statedFormat.test(text)) {
    return "message does not say what to do (no instruction or stated format)";
  }
  return undefined;
}

/** Text content of each `<FieldError>` and `<ErrorSummaryLink>` in an example source. */
function errorMessages(source: string) {
  return [...source.matchAll(/<(FieldError|ErrorSummaryLink)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(
    ([, part, children]) => ({ part: part!, text: children!.replace(/\s+/g, " ").trim() }),
  );
}

describe("error message matcher", () => {
  it.each(["Invalid", "Error", "Required", "Required.", "This field is invalid", "Wrong value"])(
    "rejects the bare message %j",
    (text) => {
      expect(errorMessageProblem(text)).toBe(
        "message does not say what to do (no instruction or stated format)",
      );
    },
  );

  it.each([
    "Enter a valid email address",
    "Enter your password to sign in.",
    "Choose a delivery date",
    "Use the format YYYY-MM-DD",
    "Passwords need at least 8 characters",
  ])("accepts the instruction %j", (text) => {
    expect(errorMessageProblem(text)).toBeUndefined();
  });

  it("rejects a message computed at runtime, which this check cannot read", () => {
    expect(errorMessageProblem("{error}")).toBe(
      "message is an expression; write it in the example",
    );
  });

  it("reads multi-line children and both parts", () => {
    expect(
      errorMessages(
        '<FieldError className="x">\n  Enter a name\n</FieldError><ErrorSummaryLink href="#a">Add a city</ErrorSummaryLink>',
      ),
    ).toEqual([
      { part: "FieldError", text: "Enter a name" },
      { part: "ErrorSummaryLink", text: "Add a city" },
    ]);
  });
});

describe("docs example error messages", () => {
  const messages = Object.entries(sources).flatMap(([path, source]) =>
    errorMessages(source).map((message) => ({ file: path.replace("./cases/", ""), ...message })),
  );

  it("finds the examples' messages", () => {
    expect(messages.map(({ file }) => file)).toEqual(
      expect.arrayContaining(["error-summary.tsx", "password-field.tsx"]),
    );
  });

  it("say what to do, not just that the input is wrong", () => {
    const problems = messages.flatMap(({ file, part, text }) => {
      const problem = errorMessageProblem(text);
      return problem ? [`${file} <${part}> ${JSON.stringify(text)}: ${problem}`] : [];
    });
    expect(problems).toEqual([]);
  });
});
