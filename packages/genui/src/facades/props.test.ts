import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { precompileProps } from "../../test/precompile.js";
import { describeType } from "../catalog/describe-schema.js";
import { descriptionOf, list, shapeEntries, type PropShape } from "../catalog/schema.js";
import * as actions from "./actions.props.ark.js";
import * as actionsCompiled from "./actions.props.js";
import * as data from "./data.props.ark.js";
import * as dataCompiled from "./data.props.js";
import * as disclosure from "./disclosure.props.ark.js";
import * as disclosureCompiled from "./disclosure.props.js";
import * as feedback from "./feedback.props.ark.js";
import * as feedbackCompiled from "./feedback.props.js";
import * as forms from "./forms.props.ark.js";
import * as formsCompiled from "./forms.props.js";
import * as layout from "./layout.props.ark.js";
import * as layoutCompiled from "./layout.props.js";
import * as results from "./results.props.ark.js";
import * as resultsCompiled from "./results.props.js";

/** Each ArkType source with the module precompiled from it. */
const groups: Record<string, [Record<string, unknown>, Record<string, unknown>]> = {
  actions: [actions, actionsCompiled],
  data: [data, dataCompiled],
  disclosure: [disclosure, disclosureCompiled],
  feedback: [feedback, feedbackCompiled],
  forms: [forms, formsCompiled],
  layout: [layout, layoutCompiled],
  results: [results, resultsCompiled],
};

function describeShape(shape: PropShape) {
  return shapeEntries(shape).map((entry) => [
    entry.name,
    entry.optional,
    describeType(entry.schema),
    descriptionOf(entry.schema),
  ]);
}

describe("precompiled built-in props", () => {
  it("covers every ArkType source in this folder", () => {
    const folder = join(process.cwd(), "packages/genui/src/facades");
    const sources = readdirSync(folder)
      .filter((file) => file.endsWith(".props.ark.ts"))
      .map((file) => file.replace(".props.ark.ts", ""));
    expect(sources.sort()).toEqual(Object.keys(groups).sort());
  });

  for (const [group, [source, compiled]] of Object.entries(groups)) {
    it(`${group}.props.ts matches ${group}.props.ark.ts (run \`pnpm test -u\` after changing it)`, async () => {
      await expect(await precompileProps(`${group}.props.ark.ts`, source)).toMatchFileSnapshot(
        `./${group}.props.ts`,
      );
    });

    it(`${group}.props.ts describes every prop as its ArkType source does`, () => {
      expect(Object.keys(compiled).sort()).toEqual(Object.keys(source).sort());
      for (const [name, shape] of Object.entries(source)) {
        expect(describeShape(compiled[name] as PropShape), name).toEqual(
          describeShape(shape as PropShape),
        );
      }
    });
  }

  it("refuses rules a precompiled prop could not enforce", async () => {
    await expect(
      precompileProps("x.props.ark.ts", { badProps: { email: type("string.email") } }),
    ).rejects.toThrow(/badProps\.email uses the JSON Schema keyword/);
    await expect(
      precompileProps("x.props.ark.ts", { badProps: { tags: list({ n: type("number > 0") }) } }),
    ).rejects.toThrow(/badProps\.tags\[\]\.n/);
  });
});
