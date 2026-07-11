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

export type ComponentPart = {
  name: string;
  kind: AnatomyKind;
  description: string;
  ownsDom: boolean;
  optional?: boolean | undefined;
};

export type LessonStep = {
  title: string;
  explanation: string;
  code?: string | undefined;
  language?: CodeLanguage | undefined;
};

export type KeyboardToken =
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
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
  meaning: string;
};

export type ComponentDoc = {
  slug: string;
  title: string;
  group: ComponentGroupId;
  summary: string;
  analogy: string;
  whenToUse: string;
  parts: ComponentPart[];
  steps: LessonStep[];
  exampleSource: string;
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
