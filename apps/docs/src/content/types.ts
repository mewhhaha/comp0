import type { CatalogEntryDescription } from "@comp0/genui";

type ComponentGroupId = "actions" | "charts" | "fields" | "navigation" | "pickers";

export type CodeLanguage = "bash" | "css" | "json" | "tsx";

type AnatomyKind =
  | "root"
  | "label"
  | "trigger"
  | "value"
  | "content"
  | "region"
  | "item"
  | "input"
  | "feedback"
  | "graphic"
  | "table";

export type PartProp = {
  name: string;
  type: string;
  description: string;
};

export type ComponentPart = {
  name: string;
  kind: AnatomyKind;
  description: string;
  ownsDom: boolean;
  optional?: boolean | undefined;
  props?: PartProp[] | undefined;
};

export type LessonStep = {
  title: string;
  explanation: string;
  code?: string | undefined;
  language?: CodeLanguage | undefined;
};

export type KeyboardToken =
  | "Alt"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "Backspace"
  | "ContextMenu"
  | "Ctrl"
  | "Delete"
  | "End"
  | "Enter"
  | "Escape"
  | "F6"
  | "F10"
  | "Home"
  | "PageDown"
  | "PageUp"
  | "Shift"
  | "Space"
  | "Tab";

export type KeyboardAction = {
  keys: KeyboardToken[];
  action: string;
  scope?: string | undefined;
};

export type StateHook = {
  attribute: `[data-${string}]` | `[aria-${string}]` | `:${string}` | `--${string}`;
  /** The part (or parts) the attribute appears on. */
  on: string;
  meaning: string;
};

type ComponentExampleVariant = {
  /** Registry key suffix; the example file lives at cases/<slug>.<id>.tsx. */
  id: string;
  title: string;
  description: string;
};

export type ComponentDoc = {
  slug: string;
  title: string;
  group: ComponentGroupId;
  summary: string;
  analogy: string;
  whenToUse: string;
  imports: string[];
  parts: ComponentPart[];
  steps: LessonStep[];
  exampleSource: string;
  moreExamples?: ComponentExampleVariant[] | undefined;
  keyboard: KeyboardAction[];
  stateHooks: StateHook[];
  form: string;
  accessibility: string[];
  related: string[];
};

export type ComponentGroup = {
  id: ComponentGroupId;
  title: string;
  description: string;
  components: ComponentDoc[];
};

/** A link at the end of a section; paths with a file extension are files, not routes. */
export type DocLink = {
  label: string;
  to: string;
  description?: string | undefined;
};

type LearnSection = {
  id: string;
  title: string;
  explanation: string;
  code?: string | undefined;
  language?: CodeLanguage | undefined;
  note?: string | undefined;
  /** A live demo rendered after the explanation, by name. */
  demo?: "intelligent-ui" | undefined;
  links?: DocLink[] | undefined;
};

export type LearnDoc = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  sections: LearnSection[];
};

export type ReferenceRow = {
  name: string;
  type?: string | undefined;
  description: string;
};

export type ReferenceTable = {
  caption: string;
  /** Column headings; with two, the type column is left out. Defaults to Prop, Type, Description. */
  headings?: readonly [string, string] | readonly [string, string, string] | undefined;
  rows: ReferenceRow[];
};

/** A GenUI reference section. Text in backticks renders as code. */
export type GenUISection = {
  id: string;
  title: string;
  paragraphs: string[];
  code?: string | undefined;
  language?: CodeLanguage | undefined;
  /** The code block's caption; defaults to Example. */
  codeTitle?: string | undefined;
  tables?: ReferenceTable[] | undefined;
  list?: string[] | undefined;
  /** A list generated from `@comp0/genui` into `genui-reference.json`. */
  generated?: "expression-functions" | "prompt-rules" | undefined;
  /** The catalog group whose components this section lists, generated from `@comp0/genui`. */
  catalogGroup?: string | undefined;
  note?: string | undefined;
  links?: DocLink[] | undefined;
};

export type GenUIDoc = {
  slug: string;
  title: string;
  summary: string;
  sections: GenUISection[];
};

/**
 * What the GenUI reference pages show from `@comp0/genui` itself. Server components cannot load
 * the renderer, so a test writes this data to `genui-reference.json` and fails when it is stale.
 */
export type GenUIReference = {
  catalog: CatalogEntryDescription[];
  expressionFunctions: { name: string; summary: string }[];
  promptRules: string[];
};
