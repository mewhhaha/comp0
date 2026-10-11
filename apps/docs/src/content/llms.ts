import type {
  ComponentDoc,
  ComponentGroup,
  GenUIDoc,
  GenUIReference,
  GenUISection,
  LearnDoc,
} from "./types.js";

export const docsOrigin = "https://comp0-docs.horrible.workers.dev";
export const promptFile = "genui.prompt.md";

export type LlmsInput = {
  groups: ComponentGroup[];
  learn: LearnDoc[];
  genui: GenUIDoc[];
  genuiReference: GenUIReference;
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
const genuiUrl = (slug: string) => `${docsOrigin}/genui/${slug}`;
const promptUrl = `${docsOrigin}/${promptFile}`;

function fence(code: string, language: string) {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
  const marks = "`".repeat(longest + 1);
  return `${marks}${language}\n${code.trimEnd()}\n${marks}`;
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function genuiBlock(genui: GenUIDoc[]) {
  return [
    ...genui.map((page) => `- [${page.title}](${genuiUrl(page.slug)}): ${oneLine(page.summary)}`),
    `- [@comp0/genui system prompt](${promptUrl}): the generated JSON-format prompt that tells a model which comp0 components it may compose and the accessibility, safety, and streaming rules (ships as \`@comp0/genui/genui.prompt.md\`).`,
  ];
}

/** The short index: H1, summary, and sections of links. */
export function renderLlmsTxt({ groups, learn, genui }: LlmsInput): string {
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
  lines.push("", "## GenUI", "", ...genuiBlock(genui));
  lines.push(
    "",
    "## Optional",
    "",
    `- [Full documentation for language models](${docsOrigin}/llms-full.txt): every lesson, component, and GenUI page inlined.`,
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

function renderGenUISection(section: GenUISection, reference: GenUIReference) {
  const lines = [`#### ${section.title}`, ""];
  for (const paragraph of section.paragraphs) lines.push(oneLine(paragraph), "");
  if (section.code) lines.push(fence(section.code, section.language ?? "tsx"), "");
  for (const table of section.tables ?? []) {
    lines.push(`${table.caption}:`, "");
    for (const row of table.rows) {
      const type = row.type ? ` (\`${row.type}\`)` : "";
      lines.push(`- \`${row.name}\`${type}: ${oneLine(row.description)}`);
    }
    lines.push("");
  }
  const list = [...(section.list ?? [])];
  if (section.generated === "expression-functions") {
    list.push(...reference.expressionFunctions.map((item) => item.summary));
  }
  if (section.generated === "prompt-rules") list.push(...reference.promptRules);
  if (list.length > 0) lines.push(...list.map((item) => `- ${oneLine(item)}`), "");
  for (const entry of reference.catalog.filter((item) => item.group === section.catalogGroup)) {
    lines.push(`##### ${entry.name}`, "", oneLine(entry.description), "");
    for (const prop of entry.props) {
      const required = prop.required ? " (required)" : "";
      lines.push(`- \`${prop.name}\`${required}: \`${prop.type}\`. ${prop.description}`.trimEnd());
    }
    lines.push("");
  }
  if (section.note) lines.push(`Note: ${oneLine(section.note)}`, "");
  for (const link of section.links ?? []) {
    const description = link.description ? `: ${oneLine(link.description)}` : "";
    lines.push(`- [${link.label}](${docsOrigin}${link.to})${description}`);
  }
  if (section.links) lines.push("");
  return lines;
}

/** The full file: every lesson, component, and GenUI page inlined. */
export function renderLlmsFullTxt(input: LlmsInput): string {
  const { groups, learn, genui, genuiReference, exampleSource } = input;
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
  lines.push("## GenUI", "", ...genuiBlock(genui), "");
  for (const page of genui) {
    lines.push(
      `### ${page.title}`,
      "",
      `URL: ${genuiUrl(page.slug)}`,
      "",
      oneLine(page.summary),
      "",
    );
    for (const section of page.sections) lines.push(...renderGenUISection(section, genuiReference));
  }
  return lines.join("\n");
}
