# @comp0/genui

Let a model compose accessible comp0 interfaces. `@comp0/genui` is a model-facing layer on top of [`@comp0/react`](../react): a JSON format a model writes, a parser that renders every prefix of it while it streams, a validator that sanitizes it against a catalog and tells the model what to fix, a small state store, a safe expression evaluator, and a renderer. No third-party runtime and no provider lock-in: it works with any model that can write JSON.

- **One JSON format**: `{ "type": "Select", "label": "Plan", "name": "plan", "options": ["Basic", "Pro"] }`. A Zod schema per component is the single source of the validator, the JSON Schema for structured outputs, and the prompt.
- **Streams**: any prefix of a response renders. Components keep their identity (and typed text and focus) as the response grows; nothing warns, moves focus, or acts until the response is complete.
- **Safe by construction**: components render only the props their schema declares, only safe URLs, and text as text. Computed values run in a small whitelisted evaluator, never `eval`.
- **Accessible by schema**: every control, chart, table, and image requires its accessible name; a component without everything it requires is not rendered.
- **Repairable**: a finished response with problems yields structured errors (path, code, message) you can send back to the model.

## Install

```sh
pnpm add @comp0/genui @comp0/react zod react@^19 react-dom@^19
```

`zod` (^4), `react`, and `react-dom` (^19) are peer dependencies, so your app controls their versions. comp0 ships no CSS; components carry `data-*` hooks to style (see below).

## Render a response

```tsx
import { GenUI } from "@comp0/genui";

function Assistant({ response, streaming, savedState }) {
  return (
    <GenUI
      response={response}
      streaming={streaming}
      onAction={(action) => sendToAssistant(action.message)}
      onStateChange={(state) => save(state)}
      initialState={savedState}
      onError={(errors) => repair(formatErrors(errors))}
    />
  );
}
```

| Prop            | Meaning                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `response`      | The JSON text (hand over the whole text so far on every chunk) or an already parsed object.                  |
| `streaming`     | The response is still arriving: output is `aria-busy` in a comp0 `BusyRegion`, and buttons and submits wait. |
| `catalog`       | The components a response may use; defaults to the built-in `catalog`.                                       |
| `onAction`      | A button was pressed, a form submitted, or a suggestion chosen. Send `action.message` as the next user turn. |
| `onStateChange` | The person changed a control; receives every stored value by state key.                                      |
| `initialState`  | Values to restore, such as the last state `onStateChange` reported. Read once, when the component mounts.    |
| `onError`       | The finished response had problems. Called once per distinct set of problems, never while streaming.         |
| `store`         | A store you keep outside the component (`createGenUIStore()`), to keep state across remounts.                |

### With any provider

The renderer takes text, so wiring a provider is only accumulating chunks:

```tsx
const [response, setResponse] = useState("");
const [streaming, setStreaming] = useState(false);

async function ask(messages) {
  setResponse("");
  setStreaming(true);
  for await (const chunk of streamFromYourProvider(messages)) {
    setResponse((text) => text + chunk);
  }
  setStreaming(false);
}
```

A model may wrap the JSON in a Markdown code fence; the parser skips it. Give the model the prompt and, where the provider supports it, the JSON Schema (below).

## Tell the model what it may use

```ts
import { genuiPrompt, responseJsonSchema } from "@comp0/genui";

const system = genuiPrompt({ preamble: "You are a travel assistant." });
const schema = responseJsonSchema(); // for structured outputs and tool calling
const strict = responseJsonSchema({ strict: true }); // for OpenAI-style strict structured outputs
```

`genuiPrompt` writes the format rules, the binding and expression rules, every component with its props and descriptions, the accessibility and safety rules, and JSON examples. The same text ships pre-generated as `@comp0/genui/genui.prompt.md` (`pnpm --filter @comp0/genui prompt` regenerates it; a test fails when it is stale). Options: `preamble`, `rules` (added after the built-in ones), `examples` (objects or JSON text), `catalog`, and `root`.

`responseJsonSchema` is the recursive JSON Schema (draft 2020-12) of one root component, normally a `Stack`: `Node` is any component and every component has a `$defs` entry, so containers nest each other. With `strict: true` every property is required, optional ones are nullable, `additionalProperties` is `false`, the root is a single object, and the keywords strict mode rejects (`minLength`, `pattern`, `format`, `default`, ...) are removed. The validator treats `null` as "left out" for an optional prop, so a response written to the strict schema renders as is. Some rules a schema cannot express (unsafe URLs, expression syntax, unknown binding names) are still checked by the validator.

```ts
// OpenAI Chat Completions, structured output
response_format: {
  type: "json_schema",
  json_schema: { name: "ui", strict: true, schema: responseJsonSchema({ strict: true }) },
}
```

## The format

A response is one JSON object, normally a `Stack`.

```json
{
  "type": "Stack",
  "children": [
    { "type": "Heading", "text": "Choose a plan", "level": 2 },
    {
      "type": "Form",
      "name": "plan",
      "title": "Choose a plan",
      "submitLabel": "Continue",
      "children": [
        {
          "type": "RadioGroup",
          "label": "Plan",
          "name": "plan",
          "options": [
            { "value": "free", "label": "Free" },
            { "value": "pro", "label": "Pro, $12 per seat" }
          ],
          "value": "pro"
        },
        {
          "type": "NumberField",
          "label": "Seats",
          "name": "seats",
          "value": 5,
          "min": 1,
          "max": 100
        }
      ]
    }
  ]
}
```

That is a labelled form whose submit sends `Plan: Pro, $12 per seat; Seats: 5` as the user's message.

- **Components** are objects with a `type` (one of the catalog names) and their props inline. Write `type` first so the component appears as early as possible while streaming. The built-in props never include `type`; the text-field kind is `inputType`.
- **Containers** (`Stack`, `Grid`, `Card`, `Form`, `Disclosure`) take `children`: an array of component objects.
- **Data** is plain JSON in a prop: `options`, `tabs`, `items`, chart `data`, comparison `features`, `sources`. Where an item holds content (a tab, an accordion section) it has its own `children` array of components.
- **Optional props** may be left out or written as `null`.
- **Required props** must be present; a component that lacks one is not rendered (and, once the response is complete, reported).

### Bindings

A control that other parts depend on reads and writes a shared name. Write `{ "$bind": "seats" }` as its `value` (or `checked`), optionally with the starting value:

```json
{
  "type": "Slider",
  "label": "Seats",
  "name": "seats",
  "min": 1,
  "max": 50,
  "value": { "$bind": "seats", "initial": 5 }
}
```

- Names are letters, digits, and underscores, not starting with a digit, at most 64 characters.
- The same name in several controls shares one value. The first `initial` written for a name is used.
- **Initial state**, in order of precedence: what the person has entered, a value restored with `initialState`, the binding's `initial`, the control's own literal `value`/`checked`, then the control's default (the slider's minimum, an empty text field, unchecked).
- Controls that are not bound store their value under their `name`, inside their form: the state key is `<form name>.<name>` (just `<name>` outside a form). A bound control stores under its binding name wherever it is.
- Defaults are written into the state once the response is complete (that is not an edit and does not call `onStateChange`), so the state you save and a form submit always include them.

Accepted by: `TextField`, `TextArea`, `NumberField`, `Select`, `RadioGroup`, `CheckboxGroup`, `Slider`, `DatePicker` (`value`) and `Checkbox`, `Switch` (`checked`).

### Expressions

A computed value is `{ "$expr": "seats * 12" }`, evaluated against the bound names and re-evaluated whenever one changes. Accepted by `Output.value`, `Meter.value`, `ProgressBar.value`, and `Text.text`.

| Part      | Supported                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Values    | numbers, `"text"` or `'text'` literals, `true`, `false`, `null`, bound names                            |
| Operators | `+ - * / %`, `< <= > >=`, `== !=`, `&& \|\| !`, unary `-`, `a ? b : c`, parentheses                     |
| Functions | `round(x, digits?)`, `floor`, `ceil`, `abs`, `sign`, `sqrt`, `pow`, `min`, `max`, `sum`, `avg`, `clamp` |

`+` adds numbers or joins text. There is no property access, no assignment, and no call outside the list, and the source is parsed and walked by a hand-written evaluator (no `eval`, no `Function`). A name with no value reads as `null`, and any arithmetic with `null` is `null`; a result that is not a finite number, such as division by zero, is `null` and shows as empty. Expressions are limited to 500 characters and 200 nodes. An expression that does not parse is an error, and an expression that reads a name no control binds is reported with the fix (`add {"$bind": "price"} to a control`).

### Actions

`onAction` receives:

```ts
type GenUIAction = {
  type: "button" | "form" | "suggestion";
  name?: string; // the form's name, for a form and for a button inside one
  message: string; // the person's request in their own words: send it as the next user turn
  values?: Record<string, JsonValue>; // the form's controls by control name
};
```

A form's `message` is built by `describeFormValues(fields, values)` from the visible labels and, for choices, the visible option labels: `Plan: Pro; Seats: 5` (a form submitted untouched falls back to its submit label). A `Button` sends its `message` (or its label); inside a form it also carries the values so far. A `Suggestion` sends its text. Nothing acts while `streaming` is true.

### Errors

Once the response is complete (`streaming` false), `onError` receives problems found in it, each written to be sent back to the model:

```ts
type GenUIError = {
  path: string; // JSON Pointer, e.g. "/children/2/options/1/value"
  code: GenUIErrorCode; // "syntax" | "truncated" | "unknown-type" | "missing-prop" | "invalid-prop" | ...
  message: string; // e.g. 'required property label is missing'
  component?: string; // e.g. "Select"
};
```

`formatErrors(errors)` turns them into a message such as `The response has 2 problems. Fix them and answer again with the complete corrected JSON: - /children/1 [Select]: required property label is missing`. Problems are never reported for a response that is still streaming, and never for the part of it that is still open. The renderer shows everything that is valid regardless: unknown components and props are left out, a prop of the wrong type is dropped, an unsafe URL is not used, and a component missing a required prop is not drawn. At most 50 problems are listed.

## The pieces on their own

The renderer is built from parts you can use directly, for example to validate on the server or to unit-test prompts:

```ts
import {
  parsePartialJson,
  validateResponse,
  evaluateExpression,
  parseExpression,
  createGenUIStore,
  formatErrors,
} from "@comp0/genui";

const parsed = parsePartialJson('{"type": "Stack", "children": [{"type": "Text", "text": "Hel');
parsed.value; // { type: "Stack", children: [{ type: "Text", text: "Hel" }] }
parsed.open; // Set { "", "/children", "/children/0", "/children/0/text" }
parsed.complete; // false

const { root, errors, bindings } = validateResponse(text, { complete: true });
evaluateExpression("round(seats * 1.5, 2)", { seats: 3 }); // 4.5
```

- **`parsePartialJson(text, { final? })`** parses any prefix of a JSON document into the best complete tree: open strings, arrays, and objects are closed, a key without a value is dropped, half-written escapes, numbers, and literals are not guessed at. It also returns `open`, the JSON Pointers of everything that may still grow, and `issues` for syntax it cannot recover from (everything before an issue is still returned). Nesting deeper than 100 levels and text beyond 2 MB are cut off, numbers beyond the double range become `null`, lone surrogates are repaired, and `__proto__` is an ordinary key. It never throws.
- **`validateResponse(text | parsed | object, { catalog?, complete?, known? })`** validates against the catalog and returns the component tree to render (`root`, with every node keyed by its JSON Pointer), `errors`, and the declared `bindings`. `validateNode` is the same for one finished object.
- **`createGenUIStore(initialState?)`** is the external store the controls and results read with `useSyncExternalStore`.

### Streaming contract

1. Every prefix of a response renders without errors, warnings, or thrown exceptions.
2. A component appears once its `type` is complete and every prop it requires has arrived. A string that is still being written is shown as written, except URLs (never loaded half-written), binding names, and expressions (used only once complete).
3. Nodes are keyed by their JSON Pointer, so a component already drawn is never replaced as the response grows; typed text, focus, and open or closed sections survive.
4. While `streaming`: output is `aria-busy`, buttons, suggestions, copy buttons, and form submits are disabled, nothing is validated for errors, and comp0 parts hold back data warnings and focus moves.
5. When `streaming` becomes false the full response is validated once, defaults are written into the state, and `onError` is called if there are problems.

## The catalog

```ts
import { catalog, defineEntry, nodes, bindable, computed, url } from "@comp0/genui";
```

| Group      | Components                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Layout     | `Stack`, `Grid`, `Card`, `Heading`, `Text`, `Image`, `List`                                                                           |
| Actions    | `Button`, `Link`, `Suggestions`, `CopyButton`                                                                                         |
| Forms      | `Form`, `TextField`, `TextArea`, `NumberField`, `Select`, `RadioGroup`, `CheckboxGroup`, `Checkbox`, `Switch`, `Slider`, `DatePicker` |
| Disclosure | `Tabs`, `Accordion`, `Disclosure`                                                                                                     |
| Data       | `Table`, `BarChart`, `ColumnChart`, `LineChart`, `AreaChart`, `PieChart`, `Meter`, `ProgressBar`, `Output`, `Comparison`, `CitedText` |
| Feedback   | `Alert`, `Separator`                                                                                                                  |

An entry is plain data:

```tsx
const Shout = defineEntry({
  name: "Shout",
  group: "Layout",
  description: "Loud text. Requires text.",
  props: z.object({ text: z.string().describe("What to shout.") }),
  component: ({ text }) => <strong>{text}</strong>,
});

<GenUI response={response} catalog={[...catalog, Shout]} />;
genuiPrompt({ catalog: [...catalog, Shout] });
```

In a schema use `nodes("description")` for a slot that holds nested components (the component receives a `ReactNode`), `bindable(schema)` for a value a control can bind, `computed(schema)` for a value that may be an expression, and `url("link" | "image", "description")` for a URL the validator must vet. A component receives only the props its schema declares, each possibly missing, so render defensively.

## Safety

A model's output is untrusted:

- The validator drops every prop a schema does not declare, so `dangerouslySetInnerHTML`, `on*` handlers, `style`, `srcDoc`, `className`, `id`, and `ref` cannot reach the DOM, and component names are looked up in the catalog only (never through prototypes).
- Links accept `http(s):`, `mailto:`, `tel:`, relative, and `#fragment` URLs; images accept `http(s)` and relative URLs. `javascript:`, `data:`, `blob:`, `file:`, protocol-relative URLs, and URLs hiding a scheme behind whitespace are not linked or loaded (`safeHref` and `safeImageSrc` are exported). Absolute links get `rel="noopener noreferrer"`; images load lazily without a referrer.
- Text is text: Markdown and HTML are shown literally, including text computed from what the person typed.
- Expressions run in a whitelisted evaluator with size limits; they cannot reach globals, prototypes, or functions outside the list.
- Lists, tables, and responses are bounded (500 items, 24 table columns and 800 cells, 1000 components, 40 levels of nesting), so a response cannot lock the page.
- Buttons and form submits are disabled while a response streams, so nothing acts on a half-written interface.

## Accessibility

Schemas require the accessible name of everything that needs one: labels for inputs, visible text for buttons and links, `title` for charts and cards, `caption` for tables, `alt` for images. There are no icon-only components. Charts include a data table; fields support help text through `aria-describedby`; heading levels follow card nesting; warnings and errors are announced at once while other messages are polite. Tests run axe over every answer in the conformance suite at every stage of its stream, including open selects and calendars.

## Styling hooks

No CSS ships. Components carry `data-slot` and token attributes; each is absent when the model did not choose a value:

| Component     | Attributes                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `Stack`       | `data-direction` (`column`, `row`), `data-gap` (`xs`..`xl`), `data-align` (`start`..`stretch`), `data-wrap` |
| `Grid`        | `data-columns` (1 to 6), `data-gap`                                                                         |
| `Card`        | `data-tone` (`default`, `muted`, `accent`)                                                                  |
| `Text`        | `data-tone` (`default`, `muted`, `success`, `warning`, `danger`), `data-size` (`sm`, `md`, `lg`)            |
| `Button`      | `data-variant` (`primary`, `secondary`, `danger`)                                                           |
| `Alert`       | `data-tone` (`info`, `success`, `warning`, `danger`)                                                        |
| `Table` cells | `data-numeric` on cells that hold numbers                                                                   |

The comp0 parts inside keep their own state attributes (`data-checked`, `data-selected`, `data-open`, `data-focus-visible`, and so on).

MIT licensed.
