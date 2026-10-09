import { catalog as defaultCatalog } from "../catalog/catalog.js";
import { describeType, isOptional } from "../catalog/describe-schema.js";
import { type ZodType } from "zod";
import { type CatalogEntry } from "../catalog/types.js";
import { expressionFunctions } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";

export type GenUIPromptOptions = {
  /** The components a response may use; defaults to the built-in catalog. */
  catalog?: readonly CatalogEntry[] | undefined;
  /** The opening paragraph, such as "You are a travel assistant." */
  preamble?: string | undefined;
  /** Rules added after the built-in ones. */
  rules?: readonly string[] | undefined;
  /** Complete example responses added after the built-in ones: objects or their JSON text. */
  examples?: readonly (JsonValue | string)[] | undefined;
  /** The component a response is; defaults to `"Stack"`. */
  root?: string | undefined;
};

/** Rules that keep what a model composes accessible, safe, and stable while it streams. */
export const genuiPromptRules: readonly string[] = [
  "Accessibility is required: every input has a visible label and a unique name; every chart and table has a title or caption; every image has alt text describing it; buttons and links say what they do; keep heading levels in order.",
  "Never rely on color alone. State a trend, status, or warning in words as well (a chart description, a Text with a tone, an Alert).",
  "Use Alert only for information the person must act on; use Text for ordinary explanations.",
  "Plain text only: Markdown and HTML in text props are shown literally. Link only to http(s), mailto:, tel:, relative, or #fragment URLs.",
  "Use components only when they help the person act or compare. A short answer needs just a Text inside a Stack.",
  "Put controls in a Form with a clear submitLabel. Use RadioGroup for five or fewer options and Select for more, and give a sensible default value when you know one.",
  "Pick the data component by purpose: Table for exact values, BarChart or ColumnChart to compare, LineChart or AreaChart for change over time, PieChart for parts of a whole (six slices at most), Meter for a value in a range, ProgressBar for a task.",
  'Use Output for results that depend on the person\'s choices (a price, a total, a conversion). Bind the controls ({"$bind": "seats", "initial": 5}) and write the Output value as {"$expr": "seats * 12"}; it recalculates as they change the controls. Never compute such a value yourself.',
  "Use Comparison for choosing between options (plans, products): one feature per row with a value per option, true or false for included or not, and recommended only when you can say why.",
  "Use CitedText when claims come from sources: put [1]-style markers after each claim and list every source once, in order. Never invent a source or a URL.",
  "End with Suggestions (two to four short follow-up replies) when the person would likely continue; use CopyButton only next to the visible text it copies.",
  "Streaming: write type first, then the props, and put the content people read first at the top, so the interface appears top-down while you write.",
];

/** Complete, valid example responses; tests validate them so they cannot rot. */
export const genuiPromptExamples: readonly JsonValue[] = [
  {
    type: "Stack",
    children: [
      { type: "Heading", text: "Choose a plan", level: 2 },
      {
        type: "Text",
        text: "Both plans include email support. Pick the one that fits your team.",
      },
      {
        type: "Form",
        name: "plan",
        title: "Choose a plan",
        submitLabel: "Continue",
        children: [
          {
            type: "RadioGroup",
            label: "Plan",
            name: "plan",
            options: [
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro, $12 per seat" },
            ],
            value: "pro",
            required: true,
          },
          { type: "NumberField", label: "Seats", name: "seats", value: 5, min: 1, max: 100 },
        ],
      },
    ],
  },
  {
    type: "Stack",
    children: [
      { type: "Text", text: "Revenue grew every quarter this year." },
      {
        type: "ColumnChart",
        title: "Revenue by quarter",
        data: [
          { label: "Q1", value: 18 },
          { label: "Q2", value: 31 },
          { label: "Q3", value: 42 },
          { label: "Q4", value: 57 },
        ],
        description: "Q4 was the strongest quarter.",
        categoryLabel: "Quarter",
        valueLabel: "Revenue",
        unit: "k",
      },
      {
        type: "Table",
        caption: "Revenue by quarter",
        columns: ["Quarter", "Revenue"],
        rows: [
          ["Q1", "$18k"],
          ["Q2", "$31k"],
          ["Q3", "$42k"],
          ["Q4", "$57k"],
        ],
      },
    ],
  },
  {
    type: "Stack",
    children: [
      {
        type: "Card",
        title: "Deployment",
        children: [
          { type: "Text", text: "The build passed and is ready to ship." },
          { type: "ProgressBar", label: "Rollout", value: 100 },
        ],
      },
      {
        type: "Stack",
        direction: "row",
        children: [
          {
            type: "Button",
            label: "Ship it",
            variant: "primary",
            message: "Ship the build",
          },
          { type: "Button", label: "Show the changes" },
        ],
      },
    ],
  },
  {
    type: "Stack",
    children: [
      { type: "Text", text: "Pricing is per seat, per month." },
      {
        type: "Slider",
        label: "Seats",
        name: "seats",
        min: 1,
        max: 50,
        value: { $bind: "seats", initial: 5 },
      },
      { type: "Output", label: "Yearly cost", value: { $expr: "seats * 12 * 12" }, unit: " USD" },
      {
        type: "Comparison",
        caption: "Plans compared",
        options: ["Free", "Pro"],
        features: [
          { name: "Projects", values: [3, "Unlimited"] },
          { name: "Priority support", values: [false, true] },
        ],
        recommended: "Pro",
      },
      {
        type: "CitedText",
        text: "Pro suits growing teams [1]. Free is enough to try the product [2].",
        sources: [
          { title: "Pricing page", href: "https://example.com/pricing", note: "Updated 2026" },
          { title: "Product FAQ" },
        ],
      },
      {
        type: "Suggestions",
        label: "Next steps",
        items: ["Compare with Team", "Show annual billing"],
      },
    ],
  },
];

const formatRules = [
  "Reply with ONE JSON object and nothing else: no prose before or after it, no Markdown code fence, no comments.",
  'Every component is an object with a "type" naming a component below and its props inline: {"type": "Text", "text": "Hello"}. Write "type" first. Use only the components and props listed; unknown ones are dropped.',
  'The response is one component, normally a Stack. Containers take "children": an array of component objects.',
  'Data that is not a component is plain JSON in the prop: options, tab and accordion items, chart data, comparison features, sources. Where such an item holds content it has its own "children" array of components.',
  "Omit an optional prop you do not need, or write null. Write numbers as JSON numbers, not strings. Required props must always be present.",
];

const bindingRules = [
  'A control that other parts depend on reads and writes a shared name: write {"$bind": "seats", "initial": 5} as its value (or checked). Names are letters, digits, and underscores. The same name in several controls shares one value; the first "initial" written for a name is used.',
  'A computed value is {"$expr": "seats * 12"}: an expression over bound names, allowed where a prop says Expression. Expressions use numbers, "text" literals, true, false, null, bound names, + - * / %, < <= > >=, == !=, && || !, a ? b : c, parentheses, and the functions below. Nothing else works: no property access, no other functions, no assignment.',
  "A bound name that has no value yet reads as null, and any arithmetic with null is null (shown empty). Dividing by zero is null. Give every bound control an initial value.",
];

const groupNotes: Record<string, string[]> = {
  Layout: [
    "Stack, Grid, Card, and Form take any component as children, including each other.",
    "Group related content in a Card with a title; use Heading to structure long answers.",
  ],
  Actions: [
    "A Button sends its message back to the assistant; a Link navigates.",
    "Suggestions are quick replies: pressing one sends its text as the person's next message.",
  ],
  Forms: [
    "Every control needs a visible label and a name that is unique in its form.",
    "Put controls in a Form. Use RadioGroup for five or fewer options and Select for more.",
    'Options are plain strings, or {"value": ..., "label": ...} when the stored value differs from the text.',
  ],
  Disclosure: [
    "Tabs, Accordion, and Disclosure hold components inside their items; each tab or section has its own children array.",
  ],
  Data: [
    "Charts need a title and a description with the takeaway; data points are {label, value} or {x, y}.",
    "Use Table when exact values matter more than the shape.",
    "Output shows a computed result: bind a control's value and write the Output value as an expression of the name.",
    "Comparison rows are {name, values} with one value per option; CitedText sources are {title, href, note}.",
  ],
};

function propLines(entry: CatalogEntry): string[] {
  const shape = entry.props.shape as Record<string, ZodType>;
  return Object.entries(shape).map(([key, schema]) => {
    const required = isOptional(schema) ? "" : " (required)";
    const description = (schema as { description?: string }).description ?? "";
    return `- \`${key}\`${required}: \`${describeType(schema)}\`. ${description}`.trimEnd();
  });
}

function section(title: string, lines: readonly string[]): string {
  return [`## ${title}`, ...lines, ""].join("\n");
}

function groupsOf(catalog: readonly CatalogEntry[]): [string, CatalogEntry[]][] {
  const groups = new Map<string, CatalogEntry[]>();
  for (const entry of catalog) {
    const list = groups.get(entry.group) ?? [];
    list.push(entry);
    groups.set(entry.group, list);
  }
  return [...groups];
}

function exampleText(example: JsonValue | string): string {
  return typeof example === "string" ? example : JSON.stringify(example, null, 2);
}

/**
 * The system prompt for a catalog: the response format, the binding and expression rules, every
 * component with its props and descriptions, the accessibility and safety rules, and examples.
 * Pass options to add a preamble, more rules, or more examples.
 */
export function genuiPrompt(options: GenUIPromptOptions = {}): string {
  const catalog = options.catalog ?? defaultCatalog;
  const root = options.root ?? "Stack";
  const preamble =
    options.preamble ??
    "You compose user interfaces from a fixed set of accessible components, written as JSON.";
  const parts: string[] = [preamble, ""];
  parts.push(
    section("Response format", [
      ...formatRules.map((rule) => `- ${rule}`),
      `- The root component is a ${root}.`,
    ]),
  );
  parts.push(
    section("Bindings and expressions", [
      ...bindingRules.map((rule) => `- ${rule}`),
      "",
      "Functions: " + expressionFunctions.map((item) => item.summary).join("; ") + ".",
    ]),
  );
  const componentLines: string[] = [];
  for (const [group, entries] of groupsOf(catalog)) {
    componentLines.push(`### ${group}`, "");
    for (const note of groupNotes[group] ?? []) componentLines.push(`- ${note}`);
    if ((groupNotes[group] ?? []).length > 0) componentLines.push("");
    for (const entry of entries) {
      componentLines.push(`#### ${entry.name}`, "", entry.description, "", ...propLines(entry), "");
    }
  }
  parts.push(
    section("Components", [
      'Every prop of type `Binding` accepts `{"$bind": name, "initial"?: value}`, and every prop of type `Expression` accepts `{"$expr": "..."}`. `Component[]` is an array of component objects.',
      "",
      ...componentLines,
    ]),
  );
  parts.push(
    section(
      "Rules",
      [...genuiPromptRules, ...(options.rules ?? [])].map((rule) => `- ${rule}`),
    ),
  );
  const examples = [...genuiPromptExamples, ...(options.examples ?? [])];
  parts.push(
    section("Examples", [
      "The code fences below are only for reading; your reply is the bare JSON object.",
      "",
      ...examples.flatMap((example, index) => [
        `### Example ${index + 1}`,
        "",
        "```json",
        exampleText(example),
        "```",
        "",
      ]),
    ]),
  );
  return parts.join("\n").trimEnd();
}
