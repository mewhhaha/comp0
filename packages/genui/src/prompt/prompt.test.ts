import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { catalog } from "../catalog/catalog.js";
import { defineEntry } from "../catalog/types.js";
import { parsePartialJson } from "../json/parse.js";
import { validateResponse } from "../validate/validate.js";
import { genuiPrompt, genuiPromptExamples, genuiPromptRules } from "./prompt.js";

describe("genuiPrompt", () => {
  const prompt = genuiPrompt();

  it("explains the format, bindings, and expressions", () => {
    expect(prompt).toContain("## Response format");
    expect(prompt).toContain("Reply with ONE JSON object");
    expect(prompt).toContain('{"$bind": "seats", "initial": 5}');
    expect(prompt).toContain('{"$expr": "seats * 12"}');
    expect(prompt).toContain("round(x, digits?)");
    expect(prompt).toContain("## Rules");
    for (const rule of genuiPromptRules) expect(prompt).toContain(rule);
  });

  it("lists every group, component, and prop with its type and description", () => {
    for (const group of ["Layout", "Actions", "Forms", "Disclosure", "Data", "Feedback"]) {
      expect(prompt).toContain(`### ${group}`);
    }
    for (const entry of catalog) {
      expect(prompt, entry.name).toContain(`#### ${entry.name}`);
      expect(prompt, entry.name).toContain(entry.description);
      for (const key of Object.keys(entry.props.shape))
        expect(prompt, `${entry.name}.${key}`).toContain(`\`${key}\``);
    }
    expect(prompt).toContain(
      "- `label` (required): `string`. Visible label naming the field. Required.",
    );
    expect(prompt).toContain('- `gap`: `"xs" | "sm" | "md" | "lg" | "xl"`.');
    expect(prompt).toContain("`value`: `string | Binding`");
    expect(prompt).toContain("`children` (required): `Component[]`");
  });

  it("puts valid JSON examples in the prompt", () => {
    const blocks = [...prompt.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => match[1]!);

    expect(blocks).toHaveLength(genuiPromptExamples.length);
    for (const block of blocks) {
      const parsed = parsePartialJson(block, { final: true });
      expect(parsed.complete).toBe(true);
      expect(validateResponse(parsed).errors).toEqual([]);
    }
  });

  it("validates every example without errors", () => {
    for (const example of genuiPromptExamples) {
      expect(validateResponse(example).errors).toEqual([]);
    }
  });

  it("adds a preamble, rules, and examples", () => {
    const custom = genuiPrompt({
      preamble: "Be brief.",
      rules: ["Mention cats."],
      examples: [{ type: "Text", text: "meow" }, '{"type": "Text", "text": "purr"}'],
    });

    expect(custom.startsWith("Be brief.")).toBe(true);
    expect(custom).toContain("- Mention cats.");
    expect(custom).toContain('"text": "meow"');
    expect(custom).toContain('"text": "purr"');
  });

  it("describes a custom catalog and root", () => {
    const Shout = defineEntry({
      name: "Shout",
      group: "Voices",
      description: "Loud text. Requires text.",
      props: z.object({ text: z.string().describe("What to shout.") }),
      component: () => null,
    });
    const custom = genuiPrompt({ catalog: [Shout], root: "Shout" });

    expect(custom).toContain("### Voices");
    expect(custom).toContain("#### Shout");
    expect(custom).toContain("The root component is a Shout.");
    expect(custom).not.toContain("#### Stack");
  });

  it("matches the shipped genui.prompt.md (run `pnpm --filter @comp0/genui prompt` after changes)", () => {
    const shipped = readFileSync(join(process.cwd(), "packages/genui/genui.prompt.md"), "utf8");

    expect(shipped).toBe(`${genuiPrompt()}\n`);
  });
});
