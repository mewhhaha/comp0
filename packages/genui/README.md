# @comp0/genui

Give a model a vocabulary of components and render its answer as restricted JSX. Start with a finished string while developing. Feed the same view text deltas from your model provider when you want children to appear as they arrive.

[Try the JSX editor](https://comp0-docs.horrible.workers.dev/labs/genui-rsc/compose) · [API reference](https://comp0-docs.horrible.workers.dev/genui/server)

```sh
pnpm add @comp0/genui @comp0/react react@^19 react-dom@^19
```

## Describe the interface

Define the model's vocabulary and shared state in one module that both server and client can import. A spec describes one component. A vocabulary combines specs and built-in groups. A composition pairs it with the state the model can read or bind.

```ts
// ui.ts
import {
  composition,
  forms,
  layout,
  oneOf,
  spec,
  state,
  vocabulary,
} from "@comp0/genui/vocabulary";

const city = oneOf(["Oslo", "Tokyo"]);
export const Forecast = spec("Forecast", {
  description: "A seven-day forecast for a selected city.",
  props: { city },
});
export const settings = state({ city }, { city: "Oslo" });
export const ui = composition({
  vocabulary: vocabulary(layout, forms.only("Select", "Option"), Forecast),
  state: settings,
});
```

`ui.prompt()` describes this composition to the model. `ui.validate(source)` checks an answer locally. A matching response looks like this.

```tsx
<Stack>
  <Select label="City" bind="city">
    <Option value="Oslo">Oslo</Option>
    <Option value="Tokyo">Tokyo</Option>
  </Select>
  <Forecast city={city} />
</Stack>
```

## Implement and render

Implement the shared spec in a server module. The callback receives validated, inferred props. Register each custom spec once. The renderer checks for missing implementations, duplicate registrations and implementations built from a different spec.

```tsx
// renderer.server.tsx
import { createRenderer, serverComponent } from "@comp0/genui/rsc";
import { Forecast, ui } from "./ui.js";

export const renderer = createRenderer(
  ui,
  serverComponent(Forecast, async ({ city }) => {
    const forecast = await fetchForecast(city);
    return <ForecastTable forecast={forecast} />;
  }),
);
```

The client root owns interactive state. Import the composition inside the wrapper so its schema functions stay on their side of the React Server Components boundary.

```tsx
// AnswerRoot.tsx
"use client";
import { GenUIRoot } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { ui } from "./ui.js";

export function AnswerRoot({ children }: { children: ReactNode }) {
  return <GenUIRoot ui={ui}>{children}</GenUIRoot>;
}
```

```tsx
// Answer.tsx
import { AnswerRoot } from "./AnswerRoot.js";
import { renderer } from "./renderer.server.js";

export function Answer({ source }: { source: string | AsyncIterable<string> }) {
  return (
    <AnswerRoot>
      <renderer.View source={source} />
    </AnswerRoot>
  );
}
```

For reactive data, supply a `render(name, props, signal)` transport on the client root. Its server endpoint calls `renderer.render(name, props)` to revalidate the request against the original spec. The initial render reads directly on the server. Changing the selected city refreshes just Forecast and keeps its last successful result visible while waiting. The [forecast lab](https://comp0-docs.horrible.workers.dev/labs/genui-rsc) implements both sides.

## Add an interactive component

Use the same spec API for client components. Place the component in a module marked `"use client"`, include the spec in the shared vocabulary and pass `spec.implement(Component)` to the renderer. A bound field receives its ordinary value prop and an `onChange(next)` callback that writes through the state validator. Omit the value prop when binding.

```tsx
// Additional shared spec
const CityPicker = spec("CityPicker", {
  description: "Choose a forecast city.",
  props: { label: oneOf(["City"]), "value?": city },
  binding: { prop: "value", kind: "string" },
});

// Register in the server module. CityField is a client component.
const renderer = createRenderer(uiWithPicker, CityPicker.implement(CityField));
```

A container receives React children as they stream. Use `children: "nodes"` for free composition, a list of names to constrain its children, `"text"` for text and scalar expressions, or `"label"` for text that must resolve to a visible accessible name. A compound part can declare `parents: ["List"]` and `identity: { prop: "value", scope: "List" }` to require a direct parent and a fixed, unique item value in that ancestor. Set `identity.matchesBoundValue` on a choice whose key must also pass the owning control’s bound state validator. The prompt, initial validation and later edits use these same rules.

The built-in groups are `layout`, `forms`, `charts`, `actions` and `disclosure`. Optional prop keys end in `?`. Use `fromJsonSchema`, `oneOf`, `url` or a synchronous Standard Schema provider. Hosts can read typed values with `useGenUIValue(settings, "city")` and restore validated state with `settings.createStore(savedValues)`.

## Host layouts and edits

A renderer can fill several named places in your layout from one response. Each place narrows the composition's vocabulary and sets its own limit. The resulting prompt and views use the renderer's state and implementations.

```tsx
import { hole } from "@comp0/genui/rsc";

const page = renderer.holes({
  summary: hole(layout.only("Heading", "Text"), "Summarize the trip.", { max: 3 }),
  forecast: hole(ui.vocabulary.only("Forecast"), "Show the selected city.", { max: 1 }),
});
const slots = page.fill(streamFromYourProvider(page.prompt(), message));
<AnswerRoot>
  <header>
    <slots.summary />
  </header>
  <aside>
    <slots.forecast />
  </aside>
</AnswerRoot>;
```

Assign protocol IDs to components that a later turn may revise. Keep the original view mounted. Render a second view under the same root with the exact accepted history and a stable turn ID.

```tsx
const first = '<Card id="trip" title="Draft"><Text>Two days in Oslo.</Text></Card>';
<AnswerRoot>
  <renderer.View source={first} />
  <renderer.View
    source={'<Update id="trip" title="Weekend in Oslo" />'}
    history={[first]}
    turn="assistant-2"
  />
</AnswerRoot>;
```

`Update` changes props. `Append` adds children. The complete turn validates before it commits. Retries preserve mounted identity, focus and user-entered values. Named holes accept the same history and turn options through `.fill(source, { history, turn })`. [Try the revisions lab](https://comp0-docs.horrible.workers.dev/labs/genui-edits).

## JSON and MCP Apps

For browser JSON rendering, `@comp0/genui` exposes `GenUI`, `genuiPrompt`, `responseJsonSchema`, `parsePartialJson` and `validateResponse`. Define the model-facing catalog spec once. Use it for the JSON schema, model prompt and MCP tool descriptor, then attach the browser implementation with `defineEntry(spec, Component)`. JSON supports its own binding objects, Query and Slot. Import `genuiAppTool`, `createMcpAppBridge` and `McpAppGenUI` from `@comp0/genui/mcp` to use this transport inside an MCP Apps host.

## Actions, accessibility and styling

Buttons and form actions wait for the response to settle. The root's `onAction` receives the message and form values. Supply `call` as a tool caller or an endpoint URL. `defineTool`, `runTool`, `handleToolRequest` and `httpToolCaller` provide validated tools and HTTP transport. Use `onError` for structured validation problems and `formatErrors(errors, "jsx")` for a correction request.

Model expressions use a bounded evaluator with declared state. Text renders literally. Required props and accessible names settle before controls appear, and URL schemas constrain links and images. Components expose `data-comp0`, token attributes and comp0 state attributes for styling.

MIT licensed.
