import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { CodeEditor, Description, Label, TextField } from "./index.js";

describe("code editor composition", () => {
  it("uses native textarea semantics with code-friendly defaults", () => {
    const { container } = render(
      <TextField id="source-code">
        <Label>Source code</Label>
        <Description>Edit the component implementation.</Description>
        <CodeEditor defaultValue={'const greeting = "Hello";'} name="source" readOnly />
      </TextField>,
    );
    const editor = container.querySelector<HTMLTextAreaElement>("textarea")!;

    expect(container.querySelector("label")?.htmlFor).toBe("source-code");
    expect(editor.id).toBe("source-code");
    expect(editor.getAttribute("aria-describedby")).toBe("source-code-description");
    expect(editor.value).toBe('const greeting = "Hello";');
    expect(editor.name).toBe("source");
    expect(editor.readOnly).toBe(true);
    expect(editor.hasAttribute("data-readonly")).toBe(true);
    expect(editor.getAttribute("autocapitalize")).toBe("none");
    expect(editor.getAttribute("autocomplete")).toBe("off");
    expect(editor.getAttribute("autocorrect")).toBe("off");
    expect(editor.getAttribute("spellcheck")).toBe("false");
    expect(editor.getAttribute("wrap")).toBe("off");
  });

  it("allows native text preferences to override its defaults", () => {
    const { container } = render(
      <CodeEditor
        aria-label="Source code"
        autoCapitalize="sentences"
        autoComplete="on"
        autoCorrect="on"
        spellCheck
        wrap="soft"
      />,
    );
    const editor = container.querySelector<HTMLTextAreaElement>("textarea")!;

    expect(editor.hasAttribute("data-readonly")).toBe(false);
    expect(editor.getAttribute("autocapitalize")).toBe("sentences");
    expect(editor.getAttribute("autocomplete")).toBe("on");
    expect(editor.getAttribute("autocorrect")).toBe("on");
    expect(editor.getAttribute("spellcheck")).toBe("true");
    expect(editor.getAttribute("wrap")).toBe("soft");
  });
});
