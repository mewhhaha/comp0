import type {
  GenUIAction,
  GenUIError,
  GenUIErrorCode,
  GenUIPromptOptions,
  GenUIProps,
  GenUIStore,
  ParseOptions,
  PartialParse,
  ResponseSchemaOptions,
  ValidatedResponse,
  ValidateOptions,
} from "@comp0/genui";
import type { GenUIRootProps, GenUIViewProps } from "@comp0/genui/rsc";
import type { GenUIDoc, ReferenceRow } from "./types.js";

type Documented<TObject> = {
  [TKey in keyof Required<TObject>]: { type: string; description: string };
};

/**
 * Table rows for every key of `TObject`. Pass the type argument: a key the object does not have,
 * or one it has and the table leaves out, is then a type error, so the tables follow the package.
 */
function rows<TObject>(documented: Documented<TObject>): ReferenceRow[] {
  return Object.entries<{ type: string; description: string }>(documented).map(([name, row]) => ({
    name,
    ...row,
  }));
}

const errorCodes = {
  syntax: "The text is not valid JSON past this point, or the response is empty.",
  truncated: "The response ended before its JSON was closed.",
  "not-a-component": "A value where a component belongs is not an object.",
  "missing-type": "A component object has no `type`, or its `type` is not a string.",
  "unknown-type": "The `type` is not a component in the catalog.",
  "missing-prop": "A required prop is missing, so the component is not drawn.",
  "invalid-prop": "A prop has the wrong type or value; it is dropped.",
  "unknown-prop": "The component does not declare the prop; it is dropped.",
  "unsafe-url": "A link or image URL uses a scheme that is not allowed; it is not used.",
  expression: "An `$expr` is not a string or does not parse.",
  binding:
    "A `$bind` name is not letters, digits, and underscores, or is longer than 64 characters.",
  "unknown-binding": "An expression reads a name that no control binds.",
  limit:
    "The response is larger or deeper than the renderer draws, or more problems were found than are listed.",
} satisfies Record<GenUIErrorCode, string>;

export const genuiDocs: GenUIDoc[] = [
  {
    slug: "overview",
    title: "Overview",
    summary:
      "Let a model compose your components as restricted JSX. Stream the result with React Server Components, typed state, and host-owned implementations.",
    sections: [
      {
        id: "what-it-is",
        title: "Compose components, stream children",
        paragraphs: [
          "`@comp0/genui/rsc` lets a model compose an interface from a vocabulary you choose. It writes restricted JSX: component names, validated props, nested children, and safe expressions. Your server renders the layout and streams each child through Suspense; interactive components run in the browser. Any provider that streams text works.",
        ],
        code: '<Stack gap="lg">\n  <Heading>Your trip</Heading>\n  <Select label="Seat" bind="seat">\n    <Option value="aisle">Aisle</Option>\n    <Option value="window">Window</Option>\n  </Select>\n  <Button>Find flights</Button>\n</Stack>;',
        codeTitle: "Model response",
        list: [
          "The host chooses the vocabulary and declares state names, schemas, and defaults. The model cannot introduce components or shared state outside that contract.",
          "Custom client components receive validated props and streaming React children. Data reads belong in async server components; their implementation stays on the server.",
          "The grammar is data: no imports, functions, event handlers, spreads, native HTML tags, or member access. Expressions use the whitelisted evaluator.",
          "A component waits for required props and an accessible name. Errors are reported after the response settles; buttons and submits stay disabled while it streams.",
        ],
      },
      {
        id: "start",
        title: "Choose the vocabulary and state",
        paragraphs: [
          "Import the server-safe contracts from `@comp0/genui/vocabulary`. Combine the built-in `layout`, `forms`, `charts`, `actions`, and `disclosure` groups with your own specs through `vocabulary`. Use `.only(...)` to narrow a group. The vocabulary generates its own prompt with `.prompt({ state })`.",
        ],
        code: 'import { fromJsonSchema, layout, forms, state, vocabulary } from "@comp0/genui/vocabulary";\n\nexport const settings = state({ seats: fromJsonSchema<number>({ type: "number" }) }, { seats: 1 });\nexport const ui = vocabulary(layout, forms);\nexport const system = ui.prompt({ state: settings });',
        codeTitle: "ui.ts",
      },
      {
        id: "client-root",
        title: "Import contracts inside the client root",
        paragraphs: [
          "Vocabulary and state contracts contain methods and validators. Import them locally in a client wrapper; they cannot be serialized as props from a server component. The server passes React children to this wrapper.",
        ],
        code: '"use client";\n\nimport { GenUIRoot } from "@comp0/genui/rsc/client";\nimport { type ReactNode } from "react";\nimport { settings, ui } from "./ui.js";\n\nexport function AnswerRoot({ children }: { children: ReactNode }) {\n  return (\n    <GenUIRoot vocabulary={ui} state={settings}>\n      {children}\n    </GenUIRoot>\n  );\n}',
        codeTitle: "AnswerRoot.tsx",
      },
      {
        id: "server",
        title: "Render a response",
        paragraphs: [
          "The server view imports the same contracts and consumes one `AsyncIterable<string>` of restricted JSX. Its client wrapper owns the shared store.",
        ],
        code: 'import { GenUIView } from "@comp0/genui/rsc";\nimport { AnswerRoot } from "./AnswerRoot.js";\nimport { settings, system, ui } from "./ui.js";\n\nexport function Answer({ message }: { message: string }) {\n  return (\n    <AnswerRoot>\n      <GenUIView\n        vocabulary={ui}\n        state={settings}\n        stream={streamFromYourProvider(system, message)}\n      />\n    </AnswerRoot>\n  );\n}',
        links: [
          {
            label: "Server components",
            to: "/genui/server",
          },
          {
            label: "GenUI lab",
            to: "/labs/genui-rsc",
          },
        ],
      },
      {
        id: "transports",
        title: "JSON and MCP transports",
        paragraphs: [
          "The package root `@comp0/genui` retains the structured JSON transport: `GenUI`, `genuiPrompt`, and `responseJsonSchema` for browser-rendered responses and structured outputs. `@comp0/genui/mcp` uses that transport inside an MCP Apps host. Its catalog, bindings, `Query`, and `Slot` belong to the JSON API; the RSC composition API uses vocabularies and custom components.",
        ],
        links: [
          {
            label: "JSON response format",
            to: "/genui/format",
          },
          {
            label: "JSON component catalog",
            to: "/genui/catalog",
          },
          {
            label: "JSON prompt and schema",
            to: "/genui/prompt",
          },
          {
            label: "Browser JSON renderer",
            to: "/genui/renderer",
          },
          {
            label: "Parser, validator, and store",
            to: "/genui/utilities",
          },
          {
            label: "Safety, accessibility, and styling",
            to: "/genui/safety",
          },
        ],
      },
    ],
  },
  {
    slug: "format",
    title: "JSON response format",
    summary:
      "A response is one JSON object: components with their props inline, containers with children, and shared values a model can bind and compute.",
    sections: [
      {
        id: "components",
        title: "Components are objects",
        paragraphs: [
          "Every component is an object with a `type` naming a catalog component and its props inline. The response is one component, normally a `Stack`. This form submits `Plan: Pro, $12 per seat; Seats: 5` as the person's next message.",
        ],
        code: '{\n  "type": "Stack",\n  "children": [\n    { "type": "Heading", "text": "Choose a plan", "level": 2 },\n    {\n      "type": "Form",\n      "name": "plan",\n      "title": "Choose a plan",\n      "submitLabel": "Continue",\n      "children": [\n        {\n          "type": "RadioGroup",\n          "label": "Plan",\n          "name": "plan",\n          "options": [\n            { "value": "free", "label": "Free" },\n            { "value": "pro", "label": "Pro, $12 per seat" }\n          ],\n          "value": "pro"\n        },\n        { "type": "NumberField", "label": "Seats", "name": "seats", "value": 5, "min": 1, "max": 100 }\n      ]\n    }\n  ]\n}',
        language: "json",
        codeTitle: "A response",
        list: [
          "Write `type` first, so the component appears as early as possible while it streams. No built-in prop is named `type`; the text field's kind is `inputType`.",
          "Containers (`Stack`, `Grid`, `Card`, `Form`, `Disclosure`) take `children`: an array of component objects.",
          "Data is plain JSON in a prop: `options`, `tabs`, `items`, chart `data`, comparison `features`, `sources`. An item that holds content, such as a tab or an accordion section, has its own `children` array.",
          "Optional props may be left out or written as `null`.",
          "Required props must be present. A component that lacks one is not drawn, and it is reported once the response is complete.",
          "A response may arrive inside a Markdown code fence; the parser skips the fence.",
        ],
      },
      {
        id: "bindings",
        title: "Share a value with $bind",
        paragraphs: [
          'A control that other parts depend on reads and writes a shared name. Write `{ "$bind": "seats" }` as its `value` (or `checked`), optionally with a starting value.',
          "`TextField`, `TextArea`, `NumberField`, `Select`, `RadioGroup`, `CheckboxGroup`, `Slider`, and `DatePicker` bind `value`; `Checkbox` and `Switch` bind `checked`.",
        ],
        code: '{\n  "type": "Slider",\n  "label": "Seats",\n  "name": "seats",\n  "min": 1,\n  "max": 50,\n  "value": { "$bind": "seats", "initial": 5 }\n}',
        language: "json",
        codeTitle: "A bound slider",
        list: [
          "Names are letters, digits, and underscores, do not start with a digit, and are at most 64 characters.",
          "The same name in several controls shares one value. The first `initial` written for a name is used.",
          "The starting value, in order of precedence: what the person entered, a value restored with `initialState`, the binding's `initial`, the control's own literal `value` or `checked`, then the control's default (the slider's minimum, an empty text field, unchecked).",
          "A control that is not bound stores its value under `<form name>.<name>`, or just `<name>` outside a form. A bound control stores under its binding name wherever it is.",
          "Defaults are written into the state once the response is complete. That is not an edit and does not call `onStateChange`, but the state you save and a form submit always include them.",
        ],
      },
      {
        id: "expressions",
        title: "Compute a value with $expr",
        paragraphs: [
          'A computed value is `{ "$expr": "seats * 12" }`, evaluated against the bound names and evaluated again whenever one of them changes. `Output.value`, `Meter.value`, `ProgressBar.value`, and `Text.text` accept expressions.',
          "`+` adds numbers or joins text. There is no property access, no assignment, and no call outside the list below; a hand-written parser reads the source and the evaluator walks the tree. A name with no value reads as `null`, arithmetic with `null` is `null`, and a result that is not a finite number, such as a division by zero, is `null` and shows as empty.",
          "Expressions are limited to 500 characters and 200 nodes. One that does not parse is an error, and one that reads a name no control binds is reported with the fix.",
        ],
        code: '{ "type": "Output", "label": "Yearly cost", "value": { "$expr": "round(seats * 12 * 12, 2)" }, "unit": " USD" }',
        language: "json",
        codeTitle: "A computed result",
        tables: [
          {
            caption: "Expression syntax",
            headings: ["Part", "Supported"],
            rows: [
              {
                name: "Values",
                description:
                  "Numbers, `\"text\"` or `'text'` literals, `true`, `false`, `null`, and bound names.",
              },
              {
                name: "Operators",
                description:
                  "`+ - * / %`, `< <= > >=`, `== !=`, `&& || !`, unary `-`, `a ? b : c`, and parentheses.",
              },
            ],
          },
        ],
        generated: "expression-functions",
      },
    ],
  },
  {
    slug: "catalog",
    title: "JSON component catalog",
    summary:
      "Every component a model may compose and the props its schema declares, generated from the catalog that validates responses.",
    sections: [
      {
        id: "reading",
        title: "How to read the catalog",
        paragraphs: [
          "Each component lists the props its schemas declare. The same schemas validate responses and write the prompt and the JSON Schema, so this page, the validator, and what the model is told cannot disagree.",
          '`Binding` accepts `{ "$bind": name, "initial"?: value }`, `Expression` accepts `{ "$expr": "..." }`, and `Component[]` is an array of component objects. A URL prop accepts only safe link or image URLs.',
        ],
      },
      {
        id: "layout",
        title: "Layout",
        paragraphs: [
          "Stacks, grids, and cards arrange everything else; headings, text, images, and lists carry the reading content. `Stack`, `Grid`, and `Card` take any component as children, including each other.",
        ],
        catalogGroup: "Layout",
      },
      {
        id: "actions",
        title: "Actions",
        paragraphs: [
          "A `Button` sends its message back to your app, a `Link` navigates, and `Suggestions` offer quick replies that become the person's next message.",
        ],
        catalogGroup: "Actions",
      },
      {
        id: "forms",
        title: "Forms",
        paragraphs: [
          'Controls go in a `Form` with a clear submit label. Every control needs a visible label and a name that is unique in its form. Options are plain strings, or `{ "value", "label" }` objects when the stored value differs from the text.',
        ],
        catalogGroup: "Forms",
      },
      {
        id: "disclosure",
        title: "Disclosure",
        paragraphs: [
          "Tabs, accordions, and disclosures hold components inside their items; each tab or section has its own `children` array.",
        ],
        catalogGroup: "Disclosure",
      },
      {
        id: "data",
        title: "Data",
        paragraphs: [
          "Tables show exact values, charts show shape, and results show what the person's choices add up to. Charts require a title and include a data table; `Output` shows a computed result; `Comparison` and `CitedText` support choosing and citing.",
        ],
        catalogGroup: "Data",
      },
      {
        id: "feedback",
        title: "Feedback",
        paragraphs: [
          "`Alert` is for information the person must act on; warnings and errors are announced at once.",
        ],
        catalogGroup: "Feedback",
      },
      {
        id: "host",
        title: "Host",
        paragraphs: [
          "`Query` and `Slot` connect the interface to your app. They are offered to the model only when you pass tools or slots to `genuiPrompt`, and they do something only when the renderer has a tool caller or the named view.",
        ],
        catalogGroup: "Host",
      },
      {
        id: "custom-components",
        title: "Add your own components",
        paragraphs: [
          "`defineEntry` declares an entry as plain data: a name, a group, a description written for the model, its props, and the React component that renders them. Props are a shape: each key holds a Standard Schema that can also describe itself as JSON Schema (ArkType 2.1.28+, zod 4.2+, or Valibot through `toStandardJsonSchema()`), and a key ending in `?` is optional. Pass the extended catalog to `GenUI`, `genuiPrompt`, and `responseJsonSchema` alike, and use `describeCatalog` to list it as plain data, as this page does. The built-ins come apart the same way: `catalogSpecs` is every built-in component as data with no renderer, safe to load on a server for prompts and schemas, and `withComponents(catalogSpecs, { ...builtInComponents, Button: MyButton })` pairs specs with components by name, so you can swap one renderer and keep what the model is told; `builtInComponents` maps each built-in name to its React component.",
          "While a response streams, a prop is checked against its JSON Schema so partial values still render. Once it is finished it must also pass the library's own `validate`, so formats and refinements count. Validators must be synchronous. A component receives only the props its schema declares, and each may be missing while the response streams, so render defensively.",
        ],
        code: 'import { catalog, defineEntry, GenUI, genuiPrompt } from "@comp0/genui";\nimport { type } from "arktype";\nimport { z } from "zod";\n\nconst Shout = defineEntry({\n  name: "Shout",\n  group: "Layout",\n  description: "Loud text. Requires text.",\n  props: {\n    text: type("string").describe("What to shout."),\n    "volume?": z.number().min(1).max(11).describe("How loud, 1 to 11."),\n  },\n  component: ({ text, volume }) => <strong data-volume={volume}>{text}</strong>,\n});\n\nconst withShout = [...catalog, Shout];\n\n<GenUI response={response} catalog={withShout} />;\ngenuiPrompt({ catalog: withShout });',
        codeTitle: "A custom entry",
        list: [
          "`nodes(description)` declares a slot for nested components; the component receives a `ReactNode`.",
          "`bindable(schema, description)` declares a value a control can bind with `$bind`.",
          "`computed(schema, description)` declares a value that may be an `$expr` expression.",
          '`url("link" | "image", description)` declares a URL the validator must vet.',
          "`list(itemShape, description)` declares a list whose items hold any of these, such as tabs with `children`.",
        ],
      },
    ],
  },
  {
    slug: "prompt",
    title: "JSON prompt and schema",
    summary:
      "Teach a model the catalog with a generated system prompt, or hold it to the format with a JSON Schema for structured outputs.",
    sections: [
      {
        id: "system-prompt",
        title: "Generate the system prompt",
        paragraphs: [
          "`genuiPrompt` writes the format rules, the binding and expression rules, every component with its props and descriptions, the accessibility and safety rules, and worked JSON examples. Send it as the system message to any provider.",
        ],
        code: 'import { genuiPrompt } from "@comp0/genui";\n\nconst system = genuiPrompt({\n  preamble: "You are a travel assistant.",\n  rules: ["Prices are in euros."],\n});',
        tables: [
          {
            caption: "genuiPrompt options",
            rows: rows<GenUIPromptOptions>({
              preamble: {
                type: "string",
                description:
                  "The opening paragraph. Defaults to a sentence about composing interfaces from JSON.",
              },
              rules: {
                type: "readonly string[]",
                description: "Rules added after the built-in ones.",
              },
              examples: {
                type: "readonly (JsonValue | string)[]",
                description:
                  "Complete example responses added after the built-in ones, as objects or JSON text.",
              },
              catalog: {
                type: "readonly CatalogEntry[]",
                description:
                  "The components a response may use. Defaults to the built-in `catalog`.",
              },
              root: {
                type: "string",
                description: "The component a response is. Defaults to `Stack`.",
              },
              tools: {
                type: "Record<string, { description, input }>",
                description:
                  "The host tools a `Query` or a `call` step may use, such as those given to `runTool`. Without any, `Query` is left out.",
              },
              slots: {
                type: "Record<string, string>",
                description:
                  "The host views a `Slot` may place, by name, each with what it shows. Without any, `Slot` is left out.",
              },
            }),
          },
        ],
      },
      {
        id: "rules",
        title: "The built-in rules",
        paragraphs: [
          "These rules keep what a model composes accessible, safe, and stable while it streams. They are exported as `genuiPromptRules`, and the built-in examples as `genuiPromptExamples`; tests validate every example so they cannot rot.",
        ],
        generated: "prompt-rules",
      },
      {
        id: "shipped-prompt",
        title: "Read the shipped prompt",
        paragraphs: [
          "The prompt for the built-in catalog also ships pre-generated as `@comp0/genui/genui.prompt.md`, and this site serves the same file so coding assistants can read it. A test fails when the file is stale.",
        ],
        links: [{ label: "genui.prompt.md", to: "/genui.prompt.md" }],
      },
      {
        id: "json-schema",
        title: "Constrain the output with a schema",
        paragraphs: [
          "`responseJsonSchema` returns the recursive JSON Schema (draft 2020-12) of one root component. `Node` is any component and every component has a `$defs` entry, so containers nest each other.",
          "With `strict: true` every property is required, optional ones become nullable, `additionalProperties` is false, and the keywords strict mode rejects are removed. The validator treats `null` as a left-out optional prop, so a response written to the strict schema renders as is. Rules a schema cannot express, such as unsafe URLs, expression syntax, and unknown binding names, are still checked by the validator.",
        ],
        code: 'const response = await client.chat.completions.create({\n  model,\n  messages,\n  response_format: {\n    type: "json_schema",\n    json_schema: { name: "ui", strict: true, schema: responseJsonSchema({ strict: true }) },\n  },\n});',
        codeTitle: "OpenAI structured output",
        tables: [
          {
            caption: "responseJsonSchema options",
            rows: rows<ResponseSchemaOptions>({
              strict: {
                type: "boolean",
                description: "Shape the schema for strict structured outputs.",
              },
              catalog: {
                type: "readonly CatalogEntry[]",
                description:
                  "The components a response may use. Defaults to the built-in `catalog`.",
              },
              root: {
                type: "string",
                description: "The component at the root of the schema. Defaults to `Stack`.",
              },
            }),
          },
        ],
      },
    ],
  },
  {
    slug: "server",
    title: "Server components",
    summary:
      "Restricted JSX, streaming children, typed state, and custom components through @comp0/genui/rsc.",
    sections: [
      {
        id: "contracts",
        title: "A vocabulary is the model API",
        paragraphs: [
          '`spec(name, { description, props, children, binding })` describes a component without importing its implementation. Props are Standard Schemas; a key ending in `?` is optional. Children may be `"text"`, `"nodes"`, or a list of allowed component names. `spec.implement(Component)` adds a typed client implementation. That component belongs in a module marked `"use client"`; the renderer passes its RSC client reference, never a plain server function. `vocabulary(...)` combines specs or groups, rejects duplicate names, and generates the prompt.',
          "The server-safe entry exports `fromJsonSchema`, `oneOf`, and `url` for schemas with no runtime library. Hosts may also use synchronous Standard Schema validators from ArkType, zod, or Valibot.",
        ],
        code: 'import { spec, vocabulary, layout, forms } from "@comp0/genui/vocabulary";\nimport { ShaderCanvas } from "./ShaderCanvas.js";\n\nconst Shader = spec("Shader", {\n  description: "A live preview driven by the declared shader settings.",\n  props: {},\n}).implement(ShaderCanvas);\n\nexport const ui = vocabulary(layout, forms, Shader);',
      },
      {
        id: "state",
        title: "Declare shared state",
        paragraphs: [
          '`state(shape, defaults)` owns every shared name, validator, and initial value. A model writes `bind="seats"` on a field and `{seats * 12}` in text or an expression-capable prop. The binding kind must match the declared state schema. Unknown names and invalid writes are rejected. Unbound form controls keep local values.',
          'Host client components use `useGenUIValue(settings, "seats")` for a typed value. `useGenUIState`, `useGenUIStore`, and `useGenUICall` expose the shared scope when needed.',
        ],
        code: 'import { fromJsonSchema, layout, forms, state, vocabulary } from "@comp0/genui/vocabulary";\n\nexport const settings = state({ seats: fromJsonSchema<number>({ type: "number" }) }, { seats: 1 });\nexport const ui = vocabulary(layout, forms);\nexport const system = ui.prompt({ state: settings });\n\n// In a client component:\n// const seats = useGenUIValue(settings, "seats");',
        links: [
          {
            label: "GenUI lab",
            to: "/labs/genui-rsc",
          },
        ],
      },
      {
        id: "client-root",
        title: "Import contracts inside the client root",
        paragraphs: [
          "Vocabulary and state contracts contain methods and validators. Import them locally in a client wrapper; they cannot be serialized as props from a server component. The server passes React children to this wrapper.",
        ],
        code: '"use client";\n\nimport { GenUIRoot } from "@comp0/genui/rsc/client";\nimport { type ReactNode } from "react";\nimport { settings, ui } from "./ui.js";\n\nexport function AnswerRoot({ children }: { children: ReactNode }) {\n  return (\n    <GenUIRoot vocabulary={ui} state={settings}>\n      {children}\n    </GenUIRoot>\n  );\n}',
        codeTitle: "AnswerRoot.tsx",
      },
      {
        id: "root",
        title: "A root and its views",
        paragraphs: [
          "`GenUIRoot` is the client scope; `GenUIView` renders one response on the server. Import the same contracts in both modules; the client wrapper passes them to the root locally. Each opening tag must finish before its component renders, while text and nested children stream independently. Layout such as Stack, Grid, Heading, Text, List, and Image uses server HTML. Controls and custom client components receive React children through Suspense.",
        ],
        code: 'import { GenUIView } from "@comp0/genui/rsc";\nimport { AnswerRoot } from "./AnswerRoot.js";\nimport { settings, system, ui } from "./ui.js";\n\nexport function Answer({ message }: { message: string }) {\n  return (\n    <AnswerRoot>\n      <GenUIView\n        vocabulary={ui}\n        state={settings}\n        stream={streamFromYourProvider(system, message)}\n      />\n    </AnswerRoot>\n  );\n}',
        tables: [
          {
            caption: "GenUIRoot props",
            rows: rows<GenUIRootProps>({
              children: {
                type: "ReactNode",
                description: "Views and host components sharing the root state.",
              },
              vocabulary: {
                type: "Vocabulary",
                description:
                  "The same vocabulary used by the server views. Defaults to `builtInVocabulary`.",
              },
              state: {
                type: "StateContract",
                description: "Host-owned state names, schemas, and defaults.",
              },
              call: {
                type: "ToolCaller | string",
                description:
                  "Tool caller for button and form action steps; a function or endpoint URL.",
              },
              render: {
                type: "ComponentRenderer",
                description:
                  "Host RSC transport for refreshing one async server component after a dependent value changes.",
              },
              onAction: {
                type: "(action: GenUIAction) => void | Promise<void>",
                description:
                  "A button, form, or suggestion action. Send its message as the next user turn.",
              },
              onError: {
                type: "(errors: readonly GenUIError[]) => void",
                description: "Validation problems reported after a view finishes streaming.",
              },
              initialState: {
                type: "Readonly<Record<string, JsonValue>>",
                description: "Saved values restored through the state contract.",
              },
              store: {
                type: "GenUIStore",
                description:
                  "An externally owned store. Use `state.createStore()` to preserve its validation contract.",
              },
            }),
          },
          {
            caption: "GenUIView props",
            rows: rows<GenUIViewProps>({
              stream: {
                type: "AsyncIterable<string>",
                description: "Restricted JSX text deltas from the provider.",
              },
              history: {
                type: "readonly string[]",
                description:
                  "Exact earlier JSX responses and successful edit turns, replayed on the server for target and revision validation.",
              },
              turn: {
                type: "string",
                description:
                  "Stable identity for an edit turn. Replaying the same identity is a no-op.",
              },
              vocabulary: {
                type: "Vocabulary",
                description: "Allowed component contracts. Defaults to `builtInVocabulary`.",
              },
              state: {
                type: "StateContract",
                description: "The same state contract used by the root.",
              },
              components: {
                type: "ComponentImplementations",
                description: "Custom client references and server component definitions by name.",
              },
            }),
          },
        ],
      },
      {
        id: "data-contract",
        title: "Share the data component's spec",
        paragraphs: [
          "The client root and server view import this contract module. It describes the data component without loading its implementation.",
        ],
        code: 'import { fromJsonSchema, layout, spec, vocabulary } from "@comp0/genui/vocabulary";\n\nexport const ForecastSpec = spec("Forecast", {\n  description: "Weather for the chosen city.",\n  props: { city: fromJsonSchema<string>({ type: "string" }) },\n});\nexport const ui = vocabulary(layout, ForecastSpec);',
        codeTitle: "forecast-spec.ts",
      },
      {
        id: "data-components",
        title: "Data reads are components",
        paragraphs: [
          "`serverComponent` defines an async component and its server-safe `.spec`. Keep the spec in a shared contract module and the async implementation in a server-only module. Register the shared spec in the vocabulary and the definition in the view’s `components` map, so the client wrapper never imports server data code. The model places the component directly; the host performs its data read.",
          "If a prop depends on state, changing that value refreshes only this component after a short debounce. Supply `render` on the root using your framework’s RSC transport. Validate every incoming refresh with `renderComponent(components, name, props)` on the server. The host owns authentication and transport; genui keeps the last accepted subtree while a refresh is pending or fails.",
        ],
        code: 'import { serverComponent, GenUIView } from "@comp0/genui/rsc";\nimport { ForecastSpec, ui } from "./forecast-spec.js";\n\nconst Forecast = serverComponent(ForecastSpec.name, {\n  description: ForecastSpec.description,\n  props: ForecastSpec.props,\n  async render({ city }) {\n    const forecast = await fetchForecast(city);\n    return <ForecastTable forecast={forecast} />;\n  },\n});\nconst components = { Forecast };\n\n// Inside AnswerRoot, which imports ui locally:\n<GenUIView vocabulary={ui} components={components} stream={modelStream} />;\n// A server refresh handler calls renderComponent(components, name, props).',
      },
      {
        id: "edits",
        title: "Revise an earlier answer",
        paragraphs: [
          'Initial components may have a protocol `id`. A later response writes `Update id="target"` with changed props, or `Append to="target"` with new child components. These IDs are unique inside the root and never become DOM attributes. Keep the original root and view mounted; a follow-up view applies edits to those existing targets.',
          "Pass exact earlier response text and prior successful edits as `history`, plus a stable `turn` identity. Supplying `history` marks a turn as edits only. The server replays history and validates the whole edit turn before it commits. A missing target, invalid child, duplicate ID, or stale target revision rejects the entire turn. Replaying an accepted turn identity makes no changes.",
          "Updates preserve component identity, focus, disclosure state, and the person's field values. They cannot change identity props such as name, bind, or a collection item's value. Updating a data component's props refreshes only that target through the root's server renderer while retaining its accepted content.",
        ],
        code: '// The first answer identifies the places later turns may revise.\nconst firstResponse = `<Stack>\n  <Card id="summary" title="Draft itinerary"><Text>A weekend by the sea.</Text></Card>\n  <List id="checklist"><Item id="flight">Book the flight</Item></List>\n</Stack>`;\n\n// This is a later model response, streamed into a separate mounted view.\nconst editResponse = `<Update id="summary" title="Ready itinerary" />\n<Append to="checklist"><Item id="ferry">Book the ferry</Item></Append>`;\n\n<AnswerRoot>\n  <GenUIView vocabulary={ui} state={settings} stream={firstStream} turn="assistant-1" />\n  <GenUIView\n    vocabulary={ui}\n    state={settings}\n    stream={editStream}\n    history={[firstResponse]}\n    turn="assistant-2"\n  />\n</AnswerRoot>;',
        links: [{ label: "Recorded revisions lab", to: "/labs/genui-edits" }],
      },
      {
        id: "holes",
        title: "Let the host keep the layout",
        paragraphs: [
          "`hole(vocabulary, instruction, { max })` bounds what the model may compose in one place. `holes({...})` produces a prompt and `.fill(stream, options)` returns named React components. All holes share one model stream; each enforces its own vocabulary and maximum number of direct children. For later turns, `.fill(stream, { history, turn, state, components })` accepts the same edit history and identity. Keep edits wrapped in the same named hole tags; targets and atomic commits stay within each hole. Omit a hole from a follow-up to leave it unchanged.",
        ],
        code: 'import { hole, holes } from "@comp0/genui/rsc";\nimport { layout, forms } from "@comp0/genui/vocabulary";\nimport { AnswerRoot } from "./AnswerRoot.js";\nimport { settings } from "./ui.js";\n\nconst page = holes({\n  summary: hole(layout.only("Heading", "Text"), "Explain the result.", { max: 3 }),\n  controls: hole(forms.only("Slider", "Switch"), "Offer useful adjustments.", { max: 4 }),\n});\nconst answer = page.fill(streamFromYourProvider(page.prompt({ state: settings }), message), {\n  state: settings,\n});\n\n<AnswerRoot>\n  <header>\n    <answer.summary />\n  </header>\n  <aside>\n    <answer.controls />\n  </aside>\n</AnswerRoot>;',
      },
      {
        id: "server-actions",
        title: "Actions and errors",
        paragraphs: [
          "Buttons, forms, and suggestions remain disabled until the view settles. The root’s `onAction` receives the person’s message and any form values. Button and Form `action` steps can call a tool, set a declared value, or send a message. Supply `call` as a function or an endpoint served by `handleToolRequest`; `httpToolCaller` is available for an explicit HTTP client.",
          '`parsePartialJsx` parses prefixes; `validateJsx` (or `vocabulary.validate`) checks an ordinary tree against the vocabulary and state. `validateEdits(source, { history, vocabulary, state })` validates an entire edit turn against replayed earlier responses. The root’s `onError` reports structured problems after streaming. Send `formatErrors(errors, "jsx")` back to the model when asking for a corrected response. Later responses use `Update` and `Append` to revise mounted targets, with the contracts described below.',
        ],
      },
    ],
  },
  {
    slug: "renderer",
    title: "Browser JSON renderer",
    summary:
      "GenUI renders a response in the browser while it streams, reports what the person does, and says what the model should fix. Tools, actions, and errors work the same with server components.",
    sections: [
      {
        id: "render",
        title: "Render a response",
        paragraphs: [
          "Hand `GenUI` the whole text so far on every chunk, or an already parsed object. Output sits in a comp0 `BusyRegion`, so it is `aria-busy` while `streaming` is true.",
        ],
        code: "<GenUI\n  response={response}\n  streaming={streaming}\n  onAction={(action) => send(action.message)}\n  onStateChange={(state) => save(state)}\n  initialState={savedState}\n  onError={(errors) => send(formatErrors(errors))}\n/>;",
        tables: [
          {
            caption: "GenUI props",
            rows: rows<GenUIProps>({
              response: {
                type: "unknown",
                description:
                  "The JSON text, or an already parsed object. `null`, `undefined`, and the empty string render nothing.",
              },
              streaming: {
                type: "boolean",
                description:
                  "The response is still arriving. Buttons and submits wait until it ends.",
              },
              catalog: {
                type: "readonly CatalogEntry[]",
                description:
                  "The components a response may use. Defaults to the built-in `catalog`.",
              },
              onAction: {
                type: "(action: GenUIAction) => void",
                description:
                  "A button was pressed, a form submitted, or a suggestion chosen. Send `action.message` as the next user turn.",
              },
              onStateChange: {
                type: "(state: GenUIState) => void",
                description:
                  "The person changed a control. Receives every stored value by state key.",
              },
              initialState: {
                type: "Readonly<Record<string, unknown>>",
                description:
                  "Values to restore, such as the state `onStateChange` last reported. Read once, on mount.",
              },
              onError: {
                type: "(errors: GenUIError[]) => void",
                description:
                  "The finished response had problems. Called once per distinct set of problems, never while streaming.",
              },
              store: {
                type: "GenUIStore",
                description:
                  "A store from `createGenUIStore` kept outside the component, which then ignores `initialState`.",
              },
              call: {
                type: "ToolCaller",
                description:
                  "Runs the host's tools for `Query` nodes and `call` steps: a server function that calls `runTool`, a fetch, or an MCP `tools/call`.",
              },
              slots: {
                type: "Record<string, ReactNode>",
                description: "Host views the model can place by name with a `Slot`.",
              },
            }),
          },
        ],
      },
      {
        id: "streaming",
        title: "The streaming contract",
        paragraphs: [
          "Any provider that streams text works, because the renderer only sees a growing string.",
        ],
        list: [
          "Every prefix of a response renders without errors, warnings, or thrown exceptions.",
          "A component appears once its `type` is complete and every prop it requires has arrived. A string that is still being written shows as written, except URLs, binding names, and expressions, which are used only once complete.",
          "Nodes are keyed by their JSON Pointer, so a component already drawn is never replaced as the response grows; typed text, focus, and open sections survive.",
          "While `streaming` is true, buttons, suggestions, copy buttons, and submits are disabled, nothing is reported as an error, and comp0 parts hold back data warnings and focus moves.",
          "When `streaming` becomes false the full response is validated once, defaults are written into the state, and `onError` is called if there are problems.",
        ],
      },
      {
        id: "host",
        title: "Connect the interface to your app",
        paragraphs: [
          "The model composes layout; your app supplies what it can reach. A tool is a function with a schema for its input, declared with `defineTool`. The interface calls tools through one `call(name, args)` function you pass to the renderer, so the same tools work from an HTTP endpoint (`handleToolRequest` on the server, `httpToolCaller` or just the endpoint's URL in the browser), a function that calls `runTool` (which validates the arguments and keeps error details on the server), or an MCP `tools/call`.",
          "A `Query` node calls a tool and stores the result under a name, again whenever a bound argument changes, without another turn; a chart's `data`, a table's `rows`, or a list's `items` bound to that name follow it. A button's `action` runs steps in order: `call` a tool, `set` a value, or `send` a message. A `Slot` places one of your own views, which read the same values with hooks, so a slider the model wrote can drive your canvas live.",
          "With React Server Components, `@comp0/genui/rsc` streams layout as server HTML: `GenUIRoot` holds typed state and any number of `GenUIView` elements stream restricted JSX into it. Custom components replace the JSON transport’s `Query` and `Slot`. Server components covers it in full.",
          "Inside an MCP Apps host, `@comp0/genui/mcp` renders a response the model writes as a tool call's arguments: `genuiAppTool` describes that tool on your MCP server, and `McpAppGenUI` renders it in the app's `ui://` resource while the arguments stream, with tools going through the host's `tools/call` and actions becoming the person's next message.",
        ],
        code: "<GenUI\n  response={response}\n  streaming={streaming}\n  call={callTool}\n  slots={{ shader: <ShaderCanvas /> }}\n/>;\n\n// With React Server Components, the client AnswerRoot imports its contracts\n<AnswerRoot>\n  <GenUIView vocabulary={ui} state={settings} stream={modelStream} />\n</AnswerRoot>;",
      },
      {
        id: "actions",
        title: "Turn actions into the next turn",
        paragraphs: [
          "A form's `message` uses the visible labels and, for choices, the visible option labels: `Plan: Pro; Seats: 5`. A form submitted untouched falls back to its submit label. A `Button` sends its `message` or its label, and inside a form it also carries the values so far. A suggestion sends its text.",
        ],
        tables: [
          {
            caption: "GenUIAction",
            headings: ["Field", "Type", "Description"],
            rows: rows<GenUIAction>({
              type: {
                type: '"button" | "form" | "suggestion"',
                description: "What the person did.",
              },
              name: {
                type: "string",
                description: "The form's name, for a form and for a button inside one.",
              },
              message: {
                type: "string",
                description:
                  "The person's request in their own words. Send it as the next user turn.",
              },
              values: {
                type: "Record<string, JsonValue>",
                description:
                  "The form's controls by control name, when the action belongs to a form.",
              },
            }),
          },
        ],
      },
      {
        id: "state",
        title: "Save and restore what the person entered",
        paragraphs: [
          "`onStateChange` receives every stored value by state key whenever the person edits a control. Save it with the message, and pass it back as `initialState` to restore the answer later. To keep state across remounts, create a store with `createGenUIStore()` and pass it as `store`.",
        ],
        code: "const store = createGenUIStore(savedState);\n\n<GenUI response={response} store={store} />;",
      },
      {
        id: "errors",
        title: "Errors the model can fix",
        paragraphs: [
          "Once the response is complete, `onError` receives the problems found in it, at most 50, each written to be sent back to the model. `formatErrors` turns them into one repair message. The renderer still shows everything that is valid: unknown components and props are left out, a prop of the wrong type is dropped, an unsafe URL is not used, and a component missing a required prop is not drawn.",
        ],
        code: "formatErrors(errors);\n// The response has 1 problem. Fix it and answer again with the complete corrected JSON:\n// - /children/1 [Select]: required property label is missing",
        tables: [
          {
            caption: "GenUIError",
            headings: ["Field", "Type", "Description"],
            rows: rows<GenUIError>({
              path: {
                type: "string",
                description:
                  "JSON Pointer to the offending value, such as `/children/2/options/1/value`. The root is the empty string.",
              },
              code: {
                type: "GenUIErrorCode",
                description: "What kind of problem it is; stable, so your app can branch on it.",
              },
              message: {
                type: "string",
                description: "One sentence naming the problem and the expected form.",
              },
              component: {
                type: "string",
                description:
                  "The `type` of the component the problem belongs to, when there is one.",
              },
            }),
          },
          {
            caption: "GenUIErrorCode",
            headings: ["Code", "Meaning"],
            rows: Object.entries(errorCodes).map(([name, description]) => ({ name, description })),
          },
        ],
      },
    ],
  },
  {
    slug: "utilities",
    title: "Parser, validator, and store",
    summary:
      "The pieces GenUI is built from, for validating on a server, testing prompts, or building your own renderer.",
    sections: [
      {
        id: "parse",
        title: "Parse a partial response",
        paragraphs: [
          "`parsePartialJson` parses any prefix of a JSON document into the best complete tree. Open strings, arrays, and objects are closed, a key without a value is dropped, and half-written escapes, numbers, and literals are not guessed at. It never throws.",
          "Nesting deeper than 100 levels and text beyond 2 MB are cut off, numbers beyond the double range become `null`, lone surrogates are repaired, and `__proto__` is an ordinary key.",
        ],
        code: 'import { parsePartialJson } from "@comp0/genui";\n\nconst parsed = parsePartialJson(\'{"type": "Stack", "children": [{"type": "Text", "text": "Hel\');\nparsed.value; // { type: "Stack", children: [{ type: "Text", text: "Hel" }] }\nparsed.open; // Set { "", "/children", "/children/0", "/children/0/text" }\nparsed.complete; // false',
        tables: [
          {
            caption: "parsePartialJson options",
            rows: rows<ParseOptions>({
              final: {
                type: "boolean",
                description:
                  "The text will not grow: a number that ends it is complete, and trailing content is reported. Defaults to false.",
              },
            }),
          },
          {
            caption: "PartialParse",
            headings: ["Field", "Type", "Description"],
            rows: rows<PartialParse>({
              value: {
                type: "JsonValue | undefined",
                description:
                  "The best tree for the text so far; `undefined` while no value has started.",
              },
              complete: {
                type: "boolean",
                description: "The document is a closed value with nothing but whitespace after it.",
              },
              open: {
                type: "ReadonlySet<string>",
                description:
                  "JSON Pointers of the values that may still grow. The root is the empty string.",
              },
              issues: {
                type: "readonly ParseIssue[]",
                description:
                  "Syntax the parser cannot recover from, with `path`, `message`, and `offset`. Everything before an issue is still returned.",
              },
            }),
          },
        ],
      },
      {
        id: "validate",
        title: "Validate on a server",
        paragraphs: [
          "`validateResponse` takes text, a `PartialParse`, or an object, and returns the component tree to render with every node keyed by its JSON Pointer, the errors, and the declared bindings. `validateNode` does the same for one finished object.",
        ],
        code: 'import { formatErrors, validateResponse } from "@comp0/genui";\n\nconst { errors } = validateResponse(text, { complete: true });\nif (errors.length > 0) await askAgain(formatErrors(errors));',
        tables: [
          {
            caption: "validateResponse options",
            rows: rows<ValidateOptions>({
              catalog: {
                type: "readonly CatalogEntry[]",
                description:
                  "The components a response may use. Defaults to the built-in `catalog`.",
              },
              complete: {
                type: "boolean",
                description:
                  "Whether the response is finished. While it is not, nothing is reported. Defaults to true.",
              },
              known: {
                type: "Iterable<string>",
                description:
                  "Names that already have a value, such as the keys of a saved state; expressions may read them.",
              },
            }),
          },
          {
            caption: "ValidatedResponse",
            headings: ["Field", "Type", "Description"],
            rows: rows<ValidatedResponse>({
              root: {
                type: "ValidNode | undefined",
                description:
                  "The component tree to render: each `ValidNode` has its `key`, catalog `entry`, and surviving `props`.",
              },
              errors: {
                type: "GenUIError[]",
                description:
                  "Problems to send back to the model; always empty while the response streams.",
              },
              complete: {
                type: "boolean",
                description: "Whether the response was finished when it was validated.",
              },
              bindings: {
                type: "ReadonlyMap<string, JsonValue | undefined>",
                description:
                  "Every binding name the response declares, with the first initial value written for it.",
              },
            }),
          },
        ],
        list: [
          "Validated props hold a `Binding` (with `name` and `initial`) for every `$bind` and a `Computed` (with the parsed `expression` and its `source`) for every `$expr`.",
        ],
      },
      {
        id: "evaluate",
        title: "Evaluate an expression",
        paragraphs: [
          "`parseExpression` returns `{ ok: true, expression }` with the names the expression reads, or `{ ok: false, message, position }`. `evaluateExpression` takes the source or a parsed expression and the values by name, as an object or a function. `expressionFunctions` lists the functions with their summaries.",
        ],
        code: 'import { evaluateExpression, parseExpression } from "@comp0/genui";\n\nevaluateExpression("round(seats * 1.5, 2)", { seats: 3 }); // 4.5\nparseExpression("seats *"); // { ok: false, message, position }',
      },
      {
        id: "store",
        title: "Keep state in a store",
        paragraphs: [
          "`createGenUIStore(initialState?)` is the external store the controls and results read with `useSyncExternalStore`, so a change re-renders exactly the parts that read it. Entries of the initial state that are not JSON values are ignored.",
        ],
        tables: [
          {
            caption: "GenUIStore",
            headings: ["Method", "Type", "Description"],
            rows: rows<GenUIStore>({
              get: {
                type: "(key: string) => JsonValue | undefined",
                description:
                  "The stored value, or `undefined` when nothing is stored under the key.",
              },
              getSnapshot: {
                type: "() => GenUIState",
                description: "Every stored value; the same object until something changes.",
              },
              set: {
                type: "(key: string, value: JsonValue | undefined) => void",
                description: "Stores a value as an edit. `undefined` removes the key.",
              },
              seed: {
                type: "(key: string, value: JsonValue) => void",
                description:
                  "Stores a default only when nothing is stored under the key. It notifies readers but is not an edit.",
              },
              subscribe: {
                type: "(listener: () => void) => () => void",
                description: "Calls `listener` after every change, including seeds.",
              },
              subscribeToEdits: {
                type: "(listener: (state: GenUIState) => void) => () => void",
                description: "Calls `listener` with a snapshot after every edit.",
              },
            }),
          },
        ],
      },
      {
        id: "helpers",
        title: "Helpers",
        paragraphs: ["Small functions the renderer uses, exported for hosts that build around it."],
        list: [
          "`formatErrors(errors)` writes the repair message for a list of `GenUIError`s.",
          "`describeFormValues(fields, values)` describes form values in the words on the screen: `Plan: Pro; Seats: 5`.",
          "`safeHref(value)` returns a link target that is safe to use, or `undefined`; `isSafeHref(value)` says whether it is.",
          "`safeImageSrc(value)` returns an image source that is safe to load, or `undefined`.",
          "`describeCatalog(catalog?)` describes a catalog as plain JSON: every component with its group, description, and props.",
        ],
      },
    ],
  },
  {
    slug: "safety",
    title: "Safety, accessibility, and styling",
    summary:
      "What a model's output can and cannot reach, how accessible names are enforced, and the hooks that style the headless output.",
    sections: [
      {
        id: "untrusted-output",
        title: "Model output is untrusted",
        paragraphs: [
          "Nothing a model writes reaches the DOM without passing through a schema and a component that renders it on purpose.",
        ],
        list: [
          "The validator drops every prop a schema does not declare, so `dangerouslySetInnerHTML`, `on*` handlers, `style`, `srcDoc`, `className`, `id`, and `ref` cannot reach the DOM. Component names are looked up in the catalog only, never through prototypes.",
          "Links accept `http(s):`, `mailto:`, `tel:`, relative, and `#fragment` URLs; images accept `http(s)` and relative URLs. `javascript:`, `data:`, `blob:`, `file:`, protocol-relative URLs, and URLs hiding a scheme behind whitespace are not linked or loaded.",
          'Absolute links get `rel="noopener noreferrer"`, and images load lazily without a referrer.',
          "Text is text: Markdown and HTML are shown literally, including text computed from what the person typed.",
          "Expressions run in a whitelisted evaluator with size limits and cannot reach globals, prototypes, or functions outside the list.",
          "Buttons and submits are disabled while a response streams, so nothing acts on a half-written interface.",
        ],
      },
      {
        id: "limits",
        title: "Limits",
        paragraphs: ["A response cannot lock the page: past these limits the rest is left out."],
        tables: [
          {
            caption: "Response limits",
            headings: ["Limit", "Value"],
            rows: [
              { name: "Components per response", description: "1000" },
              { name: "Component nesting", description: "40 levels" },
              { name: "Items in a list or data prop", description: "500" },
              { name: "Table size", description: "24 columns and 800 cells" },
              { name: "Response text", description: "2 MB, nested at most 100 levels deep" },
              { name: "Expression", description: "500 characters and 200 nodes" },
              { name: "Reported errors", description: "50" },
            ],
          },
        ],
      },
      {
        id: "accessibility",
        title: "Accessible by schema",
        paragraphs: [
          "A model is a poor judge of accessibility, so the schemas require the accessible name of everything that needs one. A component without it is not drawn, and the error tells the model what to add.",
        ],
        list: [
          "Inputs require a label, buttons and links visible text, charts and cards a `title`, tables a `caption`, and images `alt` text. There are no icon-only components.",
          "Charts include a data table, and fields support help text through `aria-describedby`.",
          "Heading levels follow card nesting.",
          "Warnings and errors are announced at once; other messages are polite.",
          "The conformance suite runs axe over every answer at every stage of its stream, including open selects and calendars.",
        ],
      },
      {
        id: "styling",
        title: "Style the output",
        paragraphs: [
          "comp0 ships no CSS. Every part carries a `data-slot`, and layout components carry token attributes that are absent when the model did not choose a value. The comp0 parts inside keep their own state attributes, such as `data-checked`, `data-selected`, `data-open`, and `data-focus-visible`, so one stylesheet themes everything a model can compose.",
        ],
        tables: [
          {
            caption: "Token attributes",
            headings: ["Attribute", "On", "Values"],
            rows: [
              { name: "data-direction", type: "Stack", description: "`column`, `row`" },
              {
                name: "data-gap",
                type: "Stack, Grid",
                description: "`xs`, `sm`, `md`, `lg`, `xl`",
              },
              {
                name: "data-align",
                type: "Stack",
                description: "`start`, `center`, `end`, `stretch`",
              },
              { name: "data-wrap", type: "Stack", description: "Present when children wrap." },
              { name: "data-columns", type: "Grid", description: "1 to 6" },
              { name: "data-tone", type: "Card", description: "`default`, `muted`, `accent`" },
              {
                name: "data-tone",
                type: "Text",
                description: "`default`, `muted`, `success`, `warning`, `danger`",
              },
              { name: "data-size", type: "Text", description: "`sm`, `md`, `lg`" },
              {
                name: "data-variant",
                type: "Button",
                description: "`primary`, `secondary`, `danger`",
              },
              {
                name: "data-tone",
                type: "Alert",
                description: "`info`, `success`, `warning`, `danger`",
              },
              {
                name: "data-numeric",
                type: "Table cells",
                description: "Present on cells that hold numbers.",
              },
            ],
          },
        ],
        code: '[data-slot="stack"] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n[data-slot="stack"][data-direction="row"] {\n  flex-direction: row;\n}\n\n[data-slot="grid"][data-columns="3"] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n}\n\n[data-slot="card"][data-tone="accent"] {\n  border-color: teal;\n}',
        language: "css",
        codeTitle: "genui.css",
        links: [{ label: "Styling lesson", to: "/learn/styling" }],
      },
    ],
  },
];

export const genuiBySlug = new Map(genuiDocs.map((page) => [page.slug, page]));
