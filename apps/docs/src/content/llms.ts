import type { ComponentDoc, ComponentGroup, LearnDoc } from "./types.js";

export const docsOrigin = "https://comp0-docs.horrible.workers.dev";
export const promptFile = "genui.prompt.md";

export type LlmsInput = {
  groups: ComponentGroup[];
  learn: LearnDoc[];
  /** The displayed example source for a slug, as the docs page shows it. */
  exampleSource: (slug: string) => string | undefined;
};

const summaryLine =
  "comp0 is a headless React component library: accessible behavior, ARIA wiring, keyboard handling, and data-attribute styling hooks, with no CSS shipped. Import everything from @comp0/react and style it with Tailwind or any CSS.";

const conventions = [
  'Import every component from the root: `import { Button } from "@comp0/react";`.',
  "Compose with children. Each family has a root, named parts, and optional `as` to change the rendered element.",
  "State props: `value`/`defaultValue`/`onChange(next)`; `open`/`defaultOpen`/`onOpenChange(next)`; checkable inputs use `checked`.",
  "Style with `className` strings and state attributes such as `data-open`, `data-selected`, `data-focus-visible`, `data-disabled`.",
  "Buttons that dismiss a surface are `*Close`; buttons that clear a value are `*Clear`; charts are `<Name>Chart`.",
];

const learnUrl = (slug: string) => `${docsOrigin}/learn/${slug}`;
const componentUrl = (slug: string) => `${docsOrigin}/components/${slug}`;
const promptUrl = `${docsOrigin}/${promptFile}`;

function fence(code: string, language: string) {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
  const marks = "`".repeat(longest + 1);
  return `${marks}${language}\n${code.trimEnd()}\n${marks}`;
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function intelligentUiBlock() {
  return [
    `- [@comp0/genui system prompt](${promptUrl}): the generated JSON-format prompt that tells a model which comp0 components it may compose and the accessibility, safety, and streaming rules (ships as \`@comp0/genui/genui.prompt.md\`).`,
    `- [Intelligent UI guide](${learnUrl("intelligent-ui")}): wire GenUI and genuiPrompt into a chat app.`,
  ];
}

/** The short index: H1, summary, and sections of links. */
export function renderLlmsTxt({ groups, learn }: LlmsInput): string {
  const lines = ["# comp0", "", `> ${summaryLine}`, ""];
  lines.push(...conventions.map((line) => `- ${line}`), "");
  lines.push("## Learn", "");
  for (const doc of learn) {
    lines.push(`- [${doc.title}](${learnUrl(doc.slug)}): ${oneLine(doc.summary)}`);
  }
  for (const group of groups) {
    lines.push("", `## ${group.title}`, "");
    for (const item of group.components) {
      lines.push(`- [${item.title}](${componentUrl(item.slug)}): ${oneLine(item.summary)}`);
    }
  }
  lines.push("", "## Intelligent UI", "", ...intelligentUiBlock());
  lines.push(
    "",
    "## Optional",
    "",
    `- [Full documentation for language models](${docsOrigin}/llms-full.txt): every lesson and component page inlined.`,
    "",
  );
  return lines.join("\n");
}

function renderComponent(item: ComponentDoc, source: string | undefined) {
  const lines = [`### ${item.title}`, "", `URL: ${componentUrl(item.slug)}`, ""];
  lines.push(oneLine(item.summary), "", `When to use: ${oneLine(item.whenToUse)}`, "");
  lines.push(`Import: ${item.imports.map((name) => `\`${name}\``).join(", ")} from "@comp0/react"`);
  lines.push("", "Parts:", "");
  for (const part of item.parts) {
    const flags = [part.kind, part.optional ? "optional" : undefined].filter(Boolean).join(", ");
    lines.push(`- \`${part.name}\` (${flags}): ${oneLine(part.description)}`);
    for (const prop of part.props ?? []) {
      lines.push(`  - \`${prop.name}: ${prop.type}\`: ${oneLine(prop.description)}`);
    }
  }
  if (item.keyboard.length > 0) {
    lines.push("", "Keyboard:", "");
    for (const action of item.keyboard) {
      const scope = action.scope ? ` (${action.scope})` : "";
      lines.push(`- ${action.keys.join(" + ")}${scope}: ${oneLine(action.action)}`);
    }
  }
  if (item.stateHooks.length > 0) {
    lines.push("", "State hooks:", "");
    for (const hook of item.stateHooks) {
      lines.push(`- \`${hook.attribute}\` on ${hook.on}: ${oneLine(hook.meaning)}`);
    }
  }
  lines.push("", `Forms: ${oneLine(item.form)}`);
  if (item.accessibility.length > 0) {
    lines.push("", "Accessibility:", "");
    for (const note of item.accessibility) lines.push(`- ${oneLine(note)}`);
  }
  if (item.related.length > 0) {
    lines.push("", `Related: ${item.related.map((slug) => `\`${slug}\``).join(", ")}`);
  }
  if (source) lines.push("", "Example:", "", fence(source, "tsx"));
  lines.push("");
  return lines;
}

/** The full file: every lesson and component page inlined. */
export function renderLlmsFullTxt(input: LlmsInput): string {
  const { groups, learn, exampleSource } = input;
  const lines = ["# comp0", "", `> ${summaryLine}`, ""];
  lines.push("## Conventions", "", ...conventions.map((line) => `- ${line}`), "");
  lines.push("## Learn", "");
  for (const doc of learn) {
    lines.push(`### ${doc.title}`, "", `URL: ${learnUrl(doc.slug)}`, "", oneLine(doc.summary), "");
    for (const section of doc.sections) {
      lines.push(`#### ${section.title}`, "", oneLine(section.explanation), "");
      if (section.code) lines.push(fence(section.code, section.language ?? "tsx"), "");
      if (section.note) lines.push(`Note: ${oneLine(section.note)}`, "");
    }
  }
  for (const group of groups) {
    lines.push(`## ${group.title}`, "", oneLine(group.description), "");
    for (const item of group.components)
      lines.push(...renderComponent(item, exampleSource(item.slug)));
  }
  lines.push("## Intelligent UI", "", ...intelligentUiBlock(), "");
  return lines.join("\n");
}
