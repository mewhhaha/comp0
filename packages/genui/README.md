# @comp0/genui

Let a model compose accessible comp0 interfaces as restricted JSX. You choose the component vocabulary, declare typed state, and supply implementations. The model composes children; React Server Components stream the result. No provider dependency or third-party runtime.

[Documentation](https://comp0-docs.horrible.workers.dev/genui/overview) · [RSC reference](https://comp0-docs.horrible.workers.dev/genui/server)

```sh
pnpm add @comp0/genui @comp0/react react@^19 react-dom@^19
```

## Define the model's vocabulary

Contracts are server-safe. Combine whole groups or select only the parts you need.

```ts
import { fromJsonSchema, forms, layout, state, vocabulary } from "@comp0/genui/vocabulary";

export const settings = state(
  {
    seats: fromJsonSchema<number>({ type: "number" }),
    plan: fromJsonSchema<string>({ type: "string" }),
  },
  { seats: 1, plan: "basic" },
);
export const ui = vocabulary(layout, forms);
export const system = ui.prompt({ state: settings });
```

The model writes:

```tsx
<Card title="Your plan">
  <Select label="Plan" bind="plan">
    <Option value="basic">Basic</Option>
    <Option value="pro">Professional</Option>
  </Select>
  <Slider label="Seats" bind="seats" min={1} max={20} />
  <Text>Monthly total: {seats * 12}</Text>
</Card>
```

State names, schemas, and defaults belong to the host. A binding must match the field's kind, and writes must pass the state validator. Unbound form fields stay local. Arrays and plain data objects are allowed in props; expressions run in a whitelisted evaluator, with no property access or arbitrary code.

The built-in groups are `layout`, `forms`, `charts`, `actions`, and `disclosure`. `builtInVocabulary` combines them. Lists use `Item` children, selects use `Option` children, tabs use `TabList`, `Tab`, and `TabPanel`, and accordions use `Section` children. Button and Link labels are their text children. Form takes a required `label`, optional `submitLabel` and `action`, and field children.

## Stream a response

Use any provider that emits text deltas as an `AsyncIterable<string>`.

Vocabulary and state contracts contain methods and validators, so import them inside a client wrapper instead of passing them across the RSC boundary.

```tsx
// AnswerRoot.tsx
"use client";

import { GenUIRoot } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { settings, ui } from "./ui.js";

export function AnswerRoot({ children }: { children: ReactNode }) {
  return (
    <GenUIRoot vocabulary={ui} state={settings}>
      {children}
    </GenUIRoot>
  );
}
```

The server passes React children:

```tsx
// Answer.tsx
import { GenUIView } from "@comp0/genui/rsc";
import { AnswerRoot } from "./AnswerRoot.js";
import { settings, system, ui } from "./ui.js";

export function Answer({ message }: { message: string }) {
  return (
    <AnswerRoot>
      <GenUIView
        vocabulary={ui}
        state={settings}
        stream={streamFromYourProvider(system, message)}
      />
    </AnswerRoot>
  );
}
```

Opening tags settle props. Text and children stream through independent Suspense boundaries, including children of custom components. Static layout renders as server HTML; interactive parts are predefined client components. Buttons and form submissions wait until the view settles. `onAction` on the root receives the person's message and form values; `onError` reports structured validation problems after streaming. `formatErrors(errors, "jsx")` formats a correction request.

Host client components read typed values with `useGenUIValue(settings, "seats")` from `@comp0/genui/rsc/client`. `useGenUIState`, `useGenUIStore`, and `useGenUICall` expose the shared scope when needed. Persist validated state with `settings.createStore(savedValues)` and pass the resulting store to the root.

## Add your components

`spec` defines the model-facing contract. Its props are Standard Schemas; keys ending in `?` are optional. Children can be `"text"`, `"nodes"`, or a list of allowed component names. `.implement(Component)` checks the implementation against the inferred required props and React children. Put client implementations in modules marked `"use client"`; the server renderer passes their RSC client references.

```tsx
import { forms, layout, spec, vocabulary } from "@comp0/genui/vocabulary";
import { ShaderCanvas } from "./ShaderCanvas.js";

const Shader = spec("Shader", {
  description: "A live preview driven by the declared shader settings.",
  props: {},
}).implement(ShaderCanvas);

const ui = vocabulary(layout, forms, Shader);
```

Schema helpers `fromJsonSchema`, `oneOf`, and `url` need no schema library. Hosts may also supply synchronous Standard Schema validators from ArkType, zod, or Valibot. A schema is the single source of prop validation and the generated vocabulary prompt.

Data reads belong in async server components:

Keep the contract shared and the data implementation server-only, so the client root can import the vocabulary without importing data code:

```ts
// forecast-spec.ts
import { fromJsonSchema, layout, spec, vocabulary } from "@comp0/genui/vocabulary";

export const ForecastSpec = spec("Forecast", {
  description: "Weather for a chosen city.",
  props: { city: fromJsonSchema<string>({ type: "string" }) },
});
export const ui = vocabulary(layout, ForecastSpec);
```

```tsx
// forecast.server.tsx
import { serverComponent, GenUIView } from "@comp0/genui/rsc";
import { ForecastSpec, ui } from "./forecast-spec.js";

const Forecast = serverComponent(ForecastSpec.name, {
  description: ForecastSpec.description,
  props: ForecastSpec.props,
  async render({ city }) {
    const forecast = await fetchForecast(city);
    return <ForecastTable forecast={forecast} />;
  },
});

const components = { Forecast };
// Inside AnswerRoot, which imports this ui locally:
<GenUIView vocabulary={ui} components={components} stream={modelStream} />;
```

The model places `<Forecast city="Lisbon" />` directly, or uses a declared city value through `city={city}`. When a dependent value changes, the root's `render(name, props, signal)` callback refreshes only that component, with debounce and cancellation. The host owns its framework's RSC transport. Validate refresh requests on the server with `renderComponent(components, name, props)` before invoking the component. The last accepted subtree remains visible during a refresh or failure.

Button and Form `action` steps can call a tool, set a declared value, or send a message. Supply `call` on the root as a function or an endpoint URL; `defineTool`, `runTool`, `handleToolRequest`, and `httpToolCaller` provide validated tools and HTTP transport.

## Revise an earlier answer

Give initial components protocol IDs. A follow-up response can update their props or append children:

```tsx
// First response:
<Card id="summary" title="Draft itinerary"><Text>A weekend by the sea.</Text></Card>
<List id="checklist"><Item id="flight">Book the flight</Item></List>

// Later response:
<Update id="summary" title="Ready itinerary" />
<Append to="checklist"><Item id="ferry">Book the ferry</Item></Append>
```

Keep the root and original view mounted. Add a separate view for the edit stream with exact earlier JSX and successful edits in `history`, and a stable `turn` identity. Supplying `history` marks a turn as edits only:

```tsx
<AnswerRoot>
  <GenUIView vocabulary={ui} state={settings} stream={firstStream} turn="assistant-1" />
  <GenUIView
    vocabulary={ui}
    state={settings}
    stream={editStream}
    history={[firstResponse]}
    turn="assistant-2"
  />
</AnswerRoot>
```

The entire turn commits only after validation. Missing targets, invalid props or children, duplicate IDs, and stale target revisions reject it. Replaying an accepted turn identity is a no-op. IDs never become DOM attributes. Updates preserve mounted controls, focus, disclosure state, and user-owned values; identity props such as name, bind, and collection-item value cannot change. Data updates refresh only their target through the root's server renderer.

[Try the recorded revisions lab](https://comp0-docs.horrible.workers.dev/labs/genui-edits).

## Keep your own layout

Named holes let the model fill bounded places in a host-owned page. One stream fills all holes; each has its own vocabulary and maximum number of direct children. Later `.fill` calls accept `history` and `turn` too. Wrap edits in the same hole tags; targets and atomic commits stay scoped to each hole. Omit a hole from a follow-up to leave it unchanged.

```tsx
import { hole, holes } from "@comp0/genui/rsc";
import { layout, forms } from "@comp0/genui/vocabulary";
import { AnswerRoot } from "./AnswerRoot.js";
import { settings } from "./ui.js";

const page = holes({
  summary: hole(layout.only("Heading", "Text"), "Explain the result.", { max: 3 }),
  controls: hole(forms.only("Slider", "Switch"), "Offer useful adjustments.", { max: 4 }),
});
const answer = page.fill(streamFromYourProvider(page.prompt({ state: settings }), message), {
  state: settings,
});

<AnswerRoot>
  <header>
    <answer.summary />
  </header>
  <aside>
    <answer.controls />
  </aside>
</AnswerRoot>;
```

## JSON and MCP transports

The package root `@comp0/genui` keeps the structured JSON transport for browser-rendered answers and structured outputs: `GenUI`, `genuiPrompt`, `responseJsonSchema`, `catalog`, `defineEntry`, `parsePartialJson`, and `validateResponse`. Its binding objects, `Query`, and `Slot` are JSON transport features. `@comp0/genui/mcp` uses the same JSON transport inside an MCP Apps host through `genuiAppTool`, `createMcpAppBridge`, and `McpAppGenUI`.

RSC composition uses `parsePartialJsx`, `validateJsx`, vocabularies, typed state, and custom components, with `Update` and `Append` for later turns.

## Safety, accessibility, and styling

The model can name only vocabulary components and declared state. No imports, event handlers, spreads, native HTML tags, or executable JavaScript are accepted. Undeclared props are dropped. Links and images use vetted URLs; text is never interpreted as HTML. Required accessible names and props are enforced before rendering. Collections and response depth are bounded.

No CSS ships. Components expose `data-slot`, token attributes such as `data-gap` and `data-tone`, and the underlying comp0 state attributes (`data-selected`, `data-checked`, `data-open`, `data-focus-visible`).

MIT licensed.
