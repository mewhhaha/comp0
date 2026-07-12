export type ComponentGroupId = "actions" | "fields" | "navigation" | "pickers";

export type CodeLanguage = "bash" | "css" | "tsx";

export type AnatomyKind =
  | "root"
  | "label"
  | "trigger"
  | "value"
  | "content"
  | "item"
  | "input"
  | "feedback";

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
  | "Ctrl"
  | "End"
  | "Enter"
  | "Escape"
  | "Home"
  | "Shift"
  | "Space"
  | "Tab";

export type KeyboardAction = {
  keys: KeyboardToken[];
  action: string;
  scope?: string | undefined;
};

export type StateHook = {
  attribute: `[data-${string}]` | `[aria-${string}]` | `:${string}`;
  /** The part (or parts) the attribute appears on. */
  on: string;
  meaning: string;
};

export type ComponentExampleVariant = {
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

export type LearnSection = {
  id: string;
  title: string;
  explanation: string;
  code?: string | undefined;
  language?: CodeLanguage | undefined;
  note?: string | undefined;
};

export type LearnDoc = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  sections: LearnSection[];
};
