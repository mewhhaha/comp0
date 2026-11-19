import { examples } from "../examples/genui/gallery/examples.js";
import answerSource from "../examples/genui/Answer.tsx?raw";
import answerRootSource from "../examples/genui/AnswerRoot.tsx?raw";
import badgeSource from "../examples/genui/StatusBadge.tsx?raw";
import uiSource from "../examples/genui/ui.ts?raw";
import labContractSource from "../routes/labs/genui-rsc/contract.ts?raw";
import labRendererSource from "../routes/labs/genui-rsc/components.server.tsx?raw";
import labRootSource from "../routes/labs/genui-rsc/LabRoot.tsx?raw";
import { forecastExplorer } from "../routes/labs/genui-rsc/forecast-explorer.js";
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
      "GenUI lets a model build an interface from components you choose. Try a seat-price calculator, then use the same code to render a streamed answer.",
    sections: [
      {
        id: "what-it-is",
        title: "Try a generated interface",
        paragraphs: [
          "Move the slider to change the quote. The model supplies the JSX below. Your app supplies the slider, the price calculation’s allowed inputs, and the React components that appear on screen.",
        ],
        code: `<Stack gap="md">
  <Slider label="Seats" bind="seats" min={1} max={10} />
  <Text>Monthly total: {seats * 12} USD</Text>
</Stack>`,
        language: "jsx",
        codeTitle: "Model response",
        demo: "seat-quote",
      },
      {
        id: "install",
        title: "Run the example locally",
        paragraphs: [
          "GenUI is a private workspace package. From a checkout of comp0, run the commands below and open /genui/overview on the local docs server. The example uses React 19 Server Components and runs with a recorded response.",
        ],
        code: "pnpm install --frozen-lockfile\npnpm --filter @comp0/genui... build\npnpm dev",
        language: "bash",
      },
      {
        id: "start",
        title: "Choose what the model can use",
        paragraphs: [
          "A vocabulary lists the components available to the model. This one allows Stack, Text, and Slider. The state contract declares one number, `seats`, starting at two. The slider writes that value through `bind`, and the text reads it in an expression.",
        ],
        code: uiSource.trimEnd(),
        codeTitle: "ui.ts",
      },
      {
        id: "client-root",
        title: "Give the controls shared state",
        paragraphs: [
          "Import the composition inside a client wrapper. The wrapper owns the live values, and the server passes React children into it. This keeps schema functions on their own side of the server–client boundary.",
        ],
        code: answerRootSource.trimEnd(),
        codeTitle: "AnswerRoot.tsx",
      },
      {
        id: "server",
        title: "Render the answer",
        paragraphs: [
          "Pass the model response above as `source` to `Answer`. To connect a provider, send `ui.prompt()` as its system instruction and pass its stream of text chunks as the same prop. The renderer waits for a complete opening tag before rendering the component and streams its children as they arrive.",
        ],
        code: answerSource.trimEnd(),
        codeTitle: "Answer.tsx",
        links: [
          {
            label: "GenUI examples",
            to: "/genui/examples",
            description: "Send a sample prompt and try the controls in the reply.",
          },
          {
            label: "JSX playground",
            to: "/labs/genui-rsc/compose",
            description: "Edit a response and inspect its validation errors.",
          },
          {
            label: "JSX composition",
            to: "/genui/server",
            description: "Add your own controls and data components.",
          },
        ],
      },
      {
        id: "transports",
        title: "Use JSON in a browser or MCP App",
        paragraphs: [
          "The browser renderer accepts a JSON component tree. Use it when your provider emits structured JSON or an MCP Apps host streams tool arguments. In that format, a control uses `$bind` and a computed value uses `$expr`.",
        ],
        links: [
          {
            label: "Browser JSON renderer",
            to: "/genui/renderer",
            description: "Replay a recorded response and inspect its JSON.",
          },
          { label: "JSON response format", to: "/genui/format" },
          { label: "JSON component catalog", to: "/genui/catalog" },
        ],
      },
    ],
  },
  {
    slug: "examples",
    title: "Examples",
    summary: `Send a sample prompt and watch the assistant stream an interactive reply. These ${examples.length} recorded conversations run without a model key. Open the response source to see the JSX or JSON behind each one.`,
    sections: ["In the studio", "In the field", "Behind the scenes"].map((group) => ({
      id: group.toLowerCase().replaceAll(" ", "-"),
      title: group,
      paragraphs: [],
      links: examples
        .filter((example) => example.group === group)
        .map((example) => ({
          label: example.title,
          to: "/genui/examples/" + example.slug,
          description: example.tryIt,
        })),
    })),
  },
  {
    slug: "server",
    title: "JSX composition",
    summary:
      "Extend a composition with a client component and a server data component. The forecast and shader lab uses both in the same answer.",
    sections: [
      {
        id: "contracts",
        title: "Describe the components",
        paragraphs: [
          "The lab adds two components to `builtInVocabulary`. Shader draws a client-side preview. Forecast reads data on the server. Both start as a `spec` with a name, a model-facing description, and a shape of synchronous Standard Schema validators. A prop key ending in `?` is optional.",
          "Use `vocabulary(...)` to combine groups and specs, or `.only(...)` to narrow a group. Give the vocabulary and shared state to `composition` so validation, rendering and `ui.prompt()` use the same contracts. The built-in groups are `layout`, `forms`, `charts`, `actions` and `disclosure`.",
        ],
        code: labContractSource.trimEnd(),
        codeTitle: "contract.ts · forecast and shader lab",
      },
      {
        id: "state",
        title: "Bind a control and read its value",
        paragraphs: [
          'The lab declares `city` with four allowed values. The Select writes the shared value with `bind="city"`. Forecast reads it with `city={city}`. A bound field gets its value from state, so omit that prop in the model response.',
          'A host component inside the root can read the same value with `useGenUIValue(labState, "city")`. The client hooks `useGenUIState`, `useGenUIStore` and `useGenUICall` expose the shared state, store and tool caller.',
        ],
        code: forecastExplorer,
        language: "jsx",
        codeTitle: "Model response · forecast lab",
        links: [{ label: "Forecast and shader lab", to: "/labs/genui-rsc" }],
      },
      {
        id: "data-components",
        title: "Attach the implementations",
        paragraphs: [
          "Call `spec.implement(Component)` with a React client component, or `serverComponent(spec, render)` with a server-only data read. Register the results once with `createRenderer`. Both implementations receive props checked against the original spec. An omitted, duplicate or mismatched implementation fails at registration.",
          "The lab uses a small fixture for its forecast so it runs offline. A host can perform an asynchronous database or API read in the same callback.",
        ],
        code: labRendererSource.trimEnd(),
        codeTitle: "components.server.tsx · forecast and shader lab",
      },
      {
        id: "client-root",
        title: "Refresh a server component",
        paragraphs: [
          "The initial forecast renders directly on the server. When the user changes the city, the root calls its `render(name, props, signal)` transport to request that component again. The lab endpoint calls `labRenderer.render(name, props)` to validate the request, then returns the rendered React subtree. The previous forecast stays visible while the request is pending or if it fails.",
          "This client wrapper uses Vite’s RSC decoder. Supply the equivalent transport for your framework. The same root also connects button and form actions to the lab’s tool endpoint.",
        ],
        code: labRootSource.trimEnd(),
        codeTitle: "LabRoot.tsx · forecast and shader lab",
      },
      {
        id: "root",
        title: "A root and its views",
        paragraphs: [
          "`GenUIRoot` is the client scope; `createRenderer(ui, ...implementations)` returns a View that renders one response on the server. Import the same contracts in both modules; the client wrapper passes them to the root locally. Each opening tag must finish before its component renders, while text and nested children stream independently. Layout such as Stack, Grid, Heading, Text, List, and Image uses server HTML. Controls and custom client components receive React children through Suspense.",
        ],
        code: 'import { LabRoot } from "./LabRoot.js";\nimport { labRenderer } from "./components.server.js";\nimport { forecastExplorer } from "./forecast-explorer.js";\n\nexport function ForecastExample() {\n  return (\n    <LabRoot>\n      <labRenderer.View source={forecastExplorer} />\n    </LabRoot>\n  );\n}',
        tables: [
          {
            caption: "GenUIRoot props",
            rows: rows<GenUIRootProps>({
              children: {
                type: "ReactNode",
                description: "Views and host components sharing the root state.",
              },
              ui: {
                type: "Composition",
                description:
                  "The shared vocabulary and state contract. Defaults to the built-in vocabulary with no declared state.",
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
            caption: "renderer.View props",
            rows: rows<GenUIViewProps>({
              source: {
                type: "string | AsyncIterable<string>",
                description: "A complete JSX response or text deltas from the provider.",
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
            }),
          },
        ],
      },
      {
        id: "data-contract",
        title: "Describe children and compound parts",
        paragraphs: [
          'Choose `children: "nodes"` for a container, `"text"` for text and scalar expressions, or `"label"` for a visible accessible name. A list of names limits the component to those children. A part can declare `parents` and an `identity` prop that must be unique inside a named ancestor.',
          "A custom field can declare a binding. Its React implementation receives the ordinary value prop and an optional typed `onChange(next)` callback. The host state validator checks writes.",
        ],
        code: 'import { fromJsonSchema, spec, vocabulary } from "@comp0/genui/vocabulary";\n\nconst Board = spec("Board", { description: "A list of tasks.", props: {}, children: ["Task"] });\nconst Task = spec("Task", {\n  description: "A named task in this board.",\n  props: { slug: fromJsonSchema<string>({ type: "string" }) },\n  children: "label",\n  parents: ["Board"],\n  identity: { prop: "slug", scope: "Board" },\n});\nexport const tasks = vocabulary(Board, Task);',
      },
      {
        id: "edits",
        title: "Revise an earlier answer",
        paragraphs: [
          'Initial components may have a protocol `id`. A later response writes `Update id="target"` with changed props, or `Append to="target"` with new child components. These IDs are unique inside the root and never become DOM attributes. Keep the original root and view mounted; a follow-up view applies edits to those existing targets.',
          "Pass exact earlier response text and prior successful edits as `history`, plus a stable `turn` identity. Supplying `history` marks a turn as edits only. The server replays history and validates the whole edit turn before it commits. A missing target, invalid child, duplicate ID, or stale target revision rejects the entire turn. Replaying an accepted turn identity makes no changes.",
          "Updates preserve component identity, focus, disclosure state, and the person's field values. They cannot change identity props such as name, bind, or a collection item's value. Updating a data component's props refreshes only that target through the root's server renderer while retaining its accepted content.",
        ],
        code: '// The first answer identifies the places later turns may revise.\nconst firstResponse = `<Stack>\n  <Card id="summary" title="Draft itinerary"><Text>A weekend by the sea.</Text></Card>\n  <List id="checklist"><Item id="flight">Book the flight</Item></List>\n</Stack>`;\n\n// This is a later model response, streamed into a separate mounted view.\nconst editResponse = `<Update id="summary" title="Ready itinerary" />\n<Append to="checklist"><Item id="ferry">Book the ferry</Item></Append>`;\n\n<LabRoot>\n  <labRenderer.View source={firstResponse} turn="assistant-1" />\n  <labRenderer.View source={editResponse} history={[firstResponse]} turn="assistant-2" />\n</LabRoot>;',
        links: [{ label: "Recorded revisions lab", to: "/labs/genui-edits" }],
      },
      {
        id: "holes",
        title: "Let the host keep the layout",
        paragraphs: [
          "`hole(vocabulary, instruction, { max })` bounds what the model may compose in one place. `renderer.holes({...})` produces a prompt and `.fill(stream, options)` returns named React components. All holes share one model stream; each enforces its own vocabulary and maximum number of direct children. For later turns, `.fill(source, { history, turn })` accepts the same edit history and identity. Keep edits wrapped in the same named hole tags; targets and atomic commits stay within each hole. Omit a hole from a follow-up to leave it unchanged.",
        ],
        code: 'import { hole } from "@comp0/genui/rsc";\nimport { layout, forms } from "@comp0/genui/vocabulary";\nimport { LabRoot } from "./LabRoot.js";\nimport { labRenderer } from "./components.server.js";\n\nconst page = labRenderer.holes({\n  summary: hole(layout.only("Heading", "Text"), "Explain the result.", { max: 3 }),\n  controls: hole(forms.only("Slider", "Switch"), "Offer useful adjustments.", { max: 4 }),\n});\nconst answer = page.fill(\n  \'<summary><Heading>Weekend trip</Heading></summary><controls><Slider label="Speed" bind="speed" min={0} max={4} /></controls>\',\n);\n\n<LabRoot>\n  <header>\n    <answer.summary />\n  </header>\n  <aside>\n    <answer.controls />\n  </aside>\n</LabRoot>;',
      },
      {
        id: "server-actions",
        title: "Actions and errors",
        paragraphs: [
          "Buttons, forms, and suggestions remain disabled until the view settles. The root’s `onAction` receives the person’s message and any form values. Button and Form `action` steps can call a tool, set a declared value, or send a message. Supply `call` as a function or an endpoint served by `handleToolRequest`; `httpToolCaller` is available for an explicit HTTP client.",
          '`parsePartialJsx` parses prefixes; `validateJsx` (or `ui.validate`) checks an ordinary tree against the vocabulary and state. `validateEdits(source, { history, vocabulary, state })` validates an entire edit turn against replayed earlier responses. The root’s `onError` reports structured problems after streaming. Send `formatErrors(errors, "jsx")` back to the model when asking for a corrected response.',
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
        code: `{
  "type": "Stack",
  "children": [
    { "type": "Slider", "label": "Seats", "name": "seats", "min": 1, "max": 50, "value": { "$bind": "seats", "initial": 5 } },
    { "type": "Output", "label": "Yearly cost", "value": { "$expr": "seats * 12 * 12" }, "unit": " USD" }
  ]
}`,
        language: "json",
        codeTitle: "Annual price at 12 USD per seat per month",
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
          "A catalog spec describes a component’s JSON props. Reuse the spec in the model prompt and response schema, then attach a browser component with `defineEntry(spec, Component)`. This example adds a status badge to the built-in catalog and renders a complete response.",
          "Each prop uses a synchronous Standard Schema with JSON Schema support. The example uses ArkType. An optional key ends in `?`. During streaming, each arriving prop is checked against its JSON Schema. Once the response finishes, it also goes through the schema’s validator.",
        ],
        code: badgeSource.trimEnd(),
        codeTitle: "StatusBadge.tsx",
        list: [
          "`catalogSpecs` contains the built-in specs. `catalog` pairs those specs with their React components. Use `describeCatalog` to list their names, descriptions, and props.",
          "`builtInComponents` maps each built-in name to its implementation. To replace one, pair the original specs with a new mapping using `withComponents(catalogSpecs, { ...builtInComponents, Button: MyButton })`.",
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
                type: "readonly CatalogSpec[]",
                description:
                  "The model-facing component specs. Defaults to the built-in `catalogSpecs`.",
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
                type: "readonly CatalogSpec[]",
                description:
                  "The model-facing component specs. Defaults to the built-in `catalogSpecs`.",
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
    slug: "renderer",
    title: "Browser JSON renderer",
    summary:
      "Render a JSON response as it arrives, handle form submissions, and send validation feedback to the model.",
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
                type: "ToolCaller | string",
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
        title: "Replay a JSON response",
        demo: "json-replay",
        paragraphs: [
          "Choose a recorded answer and press Play. Open “JSON the model wrote” to compare each chunk with the controls that appear. When the answer finishes, use its buttons or submit the form to see the next message.",
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
          "A `Query` node calls a tool and stores the result under a name, again whenever a bound argument changes, without another turn; a chart's `data`, a table's `rows`, or a list's `items` bound to that name follow it. A button's `action` runs steps in order: `call` a tool, `set` a value, or `send` a message. A `Slot` places a React element from the renderer’s `slots` map. To make a host view follow a control, pass a shared `store` to `GenUI` and subscribe to its changes with React’s `useSyncExternalStore`.",
        ],
        code: '<GenUI\n  response={response}\n  streaming={streaming}\n  call="/api/tools"\n  slots={{ shader: <ShaderCanvas /> }}\n/>;',
      },
      {
        id: "mcp-apps",
        title: "Render tool arguments in an MCP App",
        paragraphs: [
          "Register a tool described by `genuiAppTool` on your MCP server and serve the app’s HTML at its `resourceUri`. The tool arguments are the JSON response. Inside the app, `McpAppGenUI` renders those arguments as they stream and uses the bridge to send actions to the host.",
        ],
        code: 'import { genuiPrompt } from "@comp0/genui";\nimport { genuiAppTool } from "@comp0/genui/mcp";\n\nexport const renderUI = genuiAppTool({\n  name: "render_ui",\n  description: genuiPrompt(),\n  resourceUri: "ui://trips/app.html",\n});',
        codeTitle: "Tool descriptor · MCP server",
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
    title: "JSON parser, validator, and store",
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
        paragraphs: [
          "The JSON renderer applies the limits below. The JSX parser counts text and expressions as well as elements toward its 1,000-node limit and allows up to 40 element levels.",
        ],
        tables: [
          {
            caption: "JSON response limits",
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
          "The built-in contracts require names for controls, charts and tables. A missing required label withholds that component and produces a validation message when the response finishes.",
        ],
        list: [
          "Inputs require a label, charts a title, tables a caption, and images alt text. JSX buttons and links use visible child text. Their JSON equivalents take a label prop. A JSX Card can group content without a title.",
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
          "comp0 ships no CSS. Every part carries a `data-comp0`, and layout components carry token attributes that are absent when the model did not choose a value. The comp0 parts inside keep their own state attributes, such as `data-checked`, `data-selected`, `data-open`, and `data-focus-visible`, so one stylesheet themes everything a model can compose.",
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
        code: '[data-comp0="stack"] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n[data-comp0="stack"][data-direction="row"] {\n  flex-direction: row;\n}\n\n[data-comp0="grid"][data-columns="3"] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n}\n\n[data-comp0="card"][data-tone="accent"] {\n  border-color: teal;\n}',
        language: "css",
        codeTitle: "genui.css",
        links: [{ label: "Styling lesson", to: "/learn/styling" }],
      },
    ],
  },
];

export const genuiBySlug = new Map(genuiDocs.map((page) => [page.slug, page]));
