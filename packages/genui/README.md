# @comp0/genui

GenUI renders a model response using components chosen by the host app. The main API accepts restricted JSX in a React Server Components app. The server validates the JSX as it arrives and streams the rendered tree to the browser using React Flight. A separate browser renderer accepts structured JSON, including tool arguments streamed by an MCP Apps host.

## Run the seat calculator

GenUI is a private workspace package. From the root of a comp0 checkout, start the docs app and open `/genui/overview` on the local server. The recorded examples run without a model API key.

```sh
pnpm install --frozen-lockfile
pnpm --filter @comp0/genui... build
pnpm dev
```

The model supplies this response. Moving the slider from two seats to three changes the monthly price from 24 USD to 36 USD.

```jsx
<Stack gap="md">
  <Slider label="Seats" bind="seats" min={1} max={10} />
  <Text>Monthly total: {seats * 12} USD</Text>
</Stack>
```

The example uses three files, each with a separate responsibility.

| File                                                                | Responsibility                                                                                                                                                                   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ui.ts](../../apps/docs/src/examples/genui/ui.ts)                   | Define the allowed components and state with `composition({ vocabulary, state })`. `ui.prompt()` describes this contract to a model and `ui.validate(source)` checks its answer. |
| [AnswerRoot.tsx](../../apps/docs/src/examples/genui/AnswerRoot.tsx) | Import the same composition in a client component and give it to `GenUIRoot`, which owns the live seat count.                                                                    |
| [Answer.tsx](../../apps/docs/src/examples/genui/Answer.tsx)         | Create a renderer and pass a string or a stream of text chunks to its `View`. Opening tags settle before their components appear, and children stream independently.             |

[Browse the GenUI examples](https://comp0-docs.horrible.workers.dev/genui/examples) to send a sample prompt and watch a recorded assistant reply stream into the page. The twelve conversations include server-side timetable refreshes, a two-panel museum exhibit and a set list that preserves your stage notes across a revision. Read the [recorded responses](../../apps/docs/src/examples/genui/gallery/examples.ts), [per-example contracts](../../apps/docs/src/examples/genui/gallery/contracts.ts), and [recording renderer](../../apps/docs/src/routes/genui-examples/recording.server.tsx) together to adapt one.

## Extend the vocabulary

A `spec` describes a component name, props, and allowed children. Combine specs with the built-in `layout`, `forms`, `charts`, `actions`, and `disclosure` groups using `vocabulary(...)`. Use `.only(...names)` to give the model a smaller set.

The forecast lab combines a server component that reads data with a client component that draws a shader. Its [shared contract](../../apps/docs/src/routes/labs/genui-rsc/contract.ts) declares both specs and their state. Its [server module](../../apps/docs/src/routes/labs/genui-rsc/components.server.tsx) registers both implementations on the same renderer.

```tsx
export const labRenderer = createRenderer(labUI, Forecast, shaderSpec.implement(ShaderCanvas));
```

Use `spec.implement(Component)` for a React component and `serverComponent(spec, render)` for a server-only data read. Components receive props checked against their specs. A container can opt into nested components or text. A field can declare a binding and write through the shared state validator. The lab’s [client root](../../apps/docs/src/routes/labs/genui-rsc/LabRoot.tsx) supplies a refresh transport so changing the city reloads only the forecast. [JSX composition guide](https://comp0-docs.horrible.workers.dev/genui/server) · [JSX playground](https://comp0-docs.horrible.workers.dev/labs/genui-rsc/compose)

## Layouts, revisions, and actions

- Use `renderer.holes` and `hole(vocabulary, instruction, { max })` to let one response fill named places in a host layout. [Host layouts](https://comp0-docs.horrible.workers.dev/genui/server#holes)
- Give a component an `id` so a later turn can change its props with `Update` or extend its children with `Append`. Supply the accepted response history and a stable turn identity. The edit keeps controls mounted and preserves user-entered values. [Revisions lab](https://comp0-docs.horrible.workers.dev/labs/genui-edits)
- Handle submitted messages and form values with `onAction`, supply `call` for tools, and use `onError` for validation problems. [Actions and errors](https://comp0-docs.horrible.workers.dev/genui/server#server-actions)

## Structured JSON and MCP Apps

Import `GenUI`, `genuiPrompt`, `responseJsonSchema` and `validateResponse` from `@comp0/genui` for the JSON transport. Model-facing catalog specs can be reused for the prompt, schema and MCP tool descriptor. Attach browser components with `defineEntry(spec, Component)`. The MCP bridge and `McpAppGenUI` live in `@comp0/genui/mcp`. [Browser JSON renderer and replay](https://comp0-docs.horrible.workers.dev/genui/renderer)

MIT licensed.
