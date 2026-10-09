import type { LearnDoc } from "./types.js";

export const learnDocs: LearnDoc[] = [
  {
    slug: "installation",
    order: 1,
    title: "Installation",
    summary: "Add comp0 once, then take every public component from the same front door.",
    sections: [
      {
        id: "install",
        title: "Install the package",
        explanation:
          "Your app needs the React package before it can use its components. Run this in the app folder, not inside the component library. After that, your package manager records comp0 as something your app depends on.",
        code: "pnpm add @comp0/react",
        language: "bash",
        note: "Think of installation as putting a new box of building blocks in your toy cupboard.",
      },
      {
        id: "root-import",
        title: "Use one root-only import",
        explanation:
          "Every supported component comes from @comp0/react. This is the public front door even when implementation files move around. Import the names you need, then use them like normal React components.",
        code: 'import { Button, TextField } from "@comp0/react";\n\n<Button>Save</Button>;',
        language: "tsx",
      },
      {
        id: "first-component",
        title: "Start with one small component",
        explanation:
          "Pick one job, such as saving a form, and add the matching component. comp0 is headless, so it gives you behavior and HTML meaning but not a finished visual theme. Style it with Tailwind utility classes after the behavior makes sense — every example in these docs does the same.",
        code: '<Button className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">\n  Save\n</Button>;',
        language: "tsx",
      },
    ],
  },
  {
    slug: "composition",
    order: 2,
    title: "Composition",
    summary: "Put named pieces together so each piece has one easy-to-understand job.",
    sections: [
      {
        id: "provider-roots",
        title: "Some roots are invisible helpers",
        explanation:
          "A root such as Dialog or TextField can hold state and connect its children without adding an extra HTML box. By default, its children become the visible DOM. This keeps your HTML clean and lets each child own the element it really is.",
        code: '<TextField>\n  <Label>Email</Label>\n  <Input name="email" />\n</TextField>;',
        language: "tsx",
        note: "Imagine the root as a backpack: it carries shared information, but it is not another piece of furniture in the room.",
      },
      {
        id: "fragment-and-as",
        title: "Add a wrapper only when you need one",
        explanation:
          "The default children behave like a React Fragment, so no wrapper is rendered. If layout or semantics need a real element, pass as with the element you want. Do not add a wrapper just because a component has a root name.",
        code: '<Dialog as="section" aria-label="Account settings">\n  {children}\n</Dialog>;',
        language: "tsx",
      },
      {
        id: "named-parts",
        title: "Keep named parts in their jobs",
        explanation:
          "Triggers open things, content holds what appears, and items are the choices inside a collection. Put each part where its parent pattern expects it. This gives comp0 enough information to connect IDs, focus, and keyboard behavior for you.",
        code: "<Popover>\n  <PopoverTrigger>More</PopoverTrigger>\n  <PopoverContent>Extra choices</PopoverContent>\n</Popover>;",
        language: "tsx",
      },
    ],
  },
  {
    slug: "styling",
    order: 3,
    title: "Styling",
    summary:
      "Style every part with Tailwind utility classes and let state attributes drive what changes.",
    sections: [
      {
        id: "tailwind-utilities",
        title: "Style the element that exists",
        explanation:
          "Headless means comp0 does not choose your colors, spacing, or borders. Pass className with Tailwind utilities to the part that actually renders an element, exactly as you would style native HTML. Plain CSS works too, but every example in these docs uses Tailwind so you can copy classes straight into your app.",
        code: '<SelectTrigger className="w-full rounded-lg border border-zinc-950/10 bg-white px-3 py-2 text-sm">\n  <SelectValue />\n</SelectTrigger>;',
        language: "tsx",
        note: "Do not search for a hidden comp0 theme. Your classes are intentionally in charge.",
      },
      {
        id: "presence-state",
        title: "Style state with data variants",
        explanation:
          'Components add attributes such as data-open only while that state is true. When a popover closes, data-open is removed instead of becoming data-open="false". Tailwind\'s data variants match exactly that presence, so data-open: and data-selected: utilities switch on and off with the state.',
        code: '<>\n  <MenuTrigger className="rounded-lg px-3 py-2 text-sm data-open:bg-zinc-100">Actions</MenuTrigger>\n\n  <SelectOption\n    className="px-3 py-2 text-sm data-selected:bg-teal-100 data-selected:font-medium"\n    value="small"\n  >\n    Small\n  </SelectOption>\n</>;',
        language: "tsx",
      },
      {
        id: "focus",
        title: "Show focus clearly",
        explanation:
          "Keyboard users need to see where they are before they press a key. Keep a strong focus-visible: outline or replace it with an equally obvious style. Also style disabled and invalid states, with data-disabled: and data-invalid:, so a control does not silently change meaning.",
        code: '<Button className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 data-disabled:opacity-50">\n  Save\n</Button>;',
        language: "tsx",
      },
    ],
  },
  {
    slug: "forms-and-state",
    order: 4,
    title: "Forms and state",
    summary:
      "Let native controls send values, and decide who remembers a component’s current state.",
    sections: [
      {
        id: "names",
        title: "Name values that a form should send",
        explanation:
          "A form only sends a control when it has a name. Put name on native inputs, checkboxes, and form-enabled picker roots. For example, Select uses its name to create a visually hidden native select proxy for submission.",
        code: '<form>\n  <Input name="email" type="email" />\n  <Select name="size" defaultValue="small">\n    <Label>Size</Label>\n    <SelectTrigger>\n      <SelectValue />\n    </SelectTrigger>\n    <SelectPopover>...</SelectPopover>\n  </Select>\n</form>;',
        language: "tsx",
        note: "A label tells a person what a control means; a name tells the browser what key to send.",
      },
      {
        id: "submit-on-enter",
        title: "Add a value by pressing Enter",
        explanation:
          'An input beside a submit button is just a form. A text input and a Button with type="submit" share one form, so pressing Enter in the field and pressing the button both fire the form\'s onSubmit — you never write a key handler for it. Give the Input a name, read that value from the submit event, then reset the form for the next entry. This is the whole “add item” field, composed from pieces you already have.',
        code: '<form\n  onSubmit={(event) => {\n    event.preventDefault();\n    const form = event.currentTarget;\n    onAdd(String(new FormData(form).get("item")));\n    form.reset();\n  }}\n>\n  <TextField>\n    <Label>New item</Label>\n    <Input name="item" placeholder="Add an item" />\n  </TextField>\n  <Button type="submit">Add</Button>\n</form>;',
        language: "tsx",
        note: "The platform does the work: Enter in a text input submits its form, and comp0's Button submits when its type is submit. SearchField is this same shape, specialized for search with an onSubmit value and a clear button.",
      },
      {
        id: "controlled",
        title: "Control state when your app needs to know now",
        explanation:
          "Use value with onChange when your app owns a selected value. Use open with onOpenChange when your app owns whether an overlay is open. The component asks for a change, and your state gives it the new value back.",
        code: "const [open, setOpen] = useState(false);\n\n<Dialog open={open} onOpenChange={setOpen}>\n  ...\n</Dialog>;",
        language: "tsx",
      },
      {
        id: "defaults",
        title: "Use a default for a starting value",
        explanation:
          "Use defaultValue, defaultSelected, or defaultOpen when the component may remember its own state after the first render. This is simpler for a small form that does not need live app state. Do not pass both a controlled value and expect a default to keep changing it later.",
        code: '<>\n  <Checkbox defaultSelected>Send me updates</Checkbox>\n  <Accordion defaultValue="shipping">...</Accordion>\n</>;',
        language: "tsx",
      },
    ],
  },
  {
    slug: "keyboard-and-accessibility",
    order: 5,
    title: "Keyboard and accessibility",
    summary: "Make every control understandable without a mouse or a pair of eyes.",
    sections: [
      {
        id: "names",
        title: "Give controls a name",
        explanation:
          "Visible text is usually the best name because everyone can see it. Use Label with fields, and use aria-label for an icon-only button or an unnamed list. A screen reader should be able to say what the focused thing does.",
        code: '<>\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" />\n  </TextField>\n\n  <Button aria-label="Close">×</Button>\n</>;',
        language: "tsx",
        note: "A tooltip is extra help, not a replacement for a button or input name.",
      },
      {
        id: "expected-keys",
        title: "Keep familiar key symbols",
        explanation:
          "Enter and Space activate buttons. Arrow keys move through menus, list boxes, radio groups, and tabs; Escape closes overlays. Let the component handle these familiar keys instead of giving them surprising new jobs.",
        code: '<Menu>\n  <MenuTrigger>Actions</MenuTrigger>\n  <MenuPopover>\n    <MenuList aria-label="Actions">...</MenuList>\n  </MenuPopover>\n</Menu>;',
        language: "tsx",
      },
      {
        id: "focus-and-feedback",
        title: "Protect focus and explain errors",
        explanation:
          "When a dialog closes, focus should return to the trigger that opened it. Keep a visible focus ring so people can follow that movement. Put Description and FieldError next to a field so help and validation feedback are connected to the input.",
        code: '<TextField invalid>\n  <Label>Email</Label>\n  <Input name="email" />\n  <FieldError>Enter a valid email.</FieldError>\n</TextField>;',
        language: "tsx",
      },
    ],
  },
  {
    slug: "accessible-page-structure",
    order: 6,
    title: "Accessible page structure",
    summary:
      "Give every page a navigable map, visible focus, comfortable targets, and styles that survive user preferences.",
    sections: [
      {
        id: "landmarks-and-bypass",
        title: "Build a native landmark map",
        explanation:
          "Use header, nav, main, aside, and footer for the regions they actually represent. Put SkipLink before repeated navigation and point it at the main landmark. Native landmarks let assistive-technology users jump between major regions without tabbing through every control.",
        code: '<>\n  <SkipLink href="#main">Skip to main content</SkipLink>\n  <header>...</header>\n  <nav aria-label="Primary">...</nav>\n  <main id="main" tabIndex={-1}>\n    ...\n  </main>\n  <footer>...</footer>\n</>;',
        language: "tsx",
        note: "Landmarks describe regions; headings describe the content hierarchy inside them. Most pages need both.",
      },
      {
        id: "focus-not-obscured",
        title: "Keep focused controls visible",
        explanation:
          "Sticky headers, cookie banners, and docked toolbars must not completely cover the control that receives focus. Reserve scrolling space around focus destinations and test keyboard navigation at high zoom. The browser can then bring the focused element into a visible area instead of hiding it behind an overlay.",
        code: ":focus-visible {\n  scroll-margin-block: 6rem 2rem;\n}",
        language: "css",
      },
      {
        id: "target-size",
        title: "Leave room to activate controls",
        explanation:
          "WCAG 2.2 requires a pointer target to contain a 24 by 24 CSS-pixel area or have enough separation from nearby targets. comp0 is headless, so your styles own this requirement. Give compact icon buttons a minimum size and avoid packing small targets directly against one another.",
        code: '<Button className="min-h-6 min-w-6">...</Button>;',
        language: "tsx",
      },
      {
        id: "preferences-and-direction",
        title: "Respect direction and display preferences",
        explanation:
          "Set dir on the document or the nearest application region and let logical keyboard navigation follow it. Keep focus and state visible in forced-colors mode, and remove non-essential motion when reduced motion is requested.",
        code: "@media (forced-colors: active) {\n  :focus-visible {\n    outline: 2px solid CanvasText;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  * {\n    scroll-behavior: auto;\n  }\n}",
        language: "css",
      },
    ],
  },
  {
    slug: "ssr",
    order: 7,
    title: "SSR",
    summary: "Make the first server picture and first browser picture match exactly.",
    sections: [
      {
        id: "same-first-render",
        title: "Render the same first tree",
        explanation:
          "Server rendering makes HTML before the browser can use window, localStorage, or media queries. React then connects to that HTML in the browser. If the first browser tree is different, React has to repair a mismatch and your UI can jump.",
        code: "// Good: the same initial value on server and client\n<Dialog defaultOpen={false}>...</Dialog>;",
        language: "tsx",
        note: "Treat the server render as the first photograph. The browser must begin with the same photograph before it starts moving.",
      },
      {
        id: "after-mount",
        title: "Read browser-only information after mount",
        explanation:
          "If a saved browser preference should open a panel, read it in an effect after hydration. Start with a stable default first. Then update controlled state once the browser is available.",
        code: 'const [open, setOpen] = useState(false);\nuseEffect(() => setOpen(localStorage.getItem("help") === "open"), []);\n\n<Popover open={open} onOpenChange={setOpen}>\n  ...\n</Popover>;',
        language: "tsx",
      },
      {
        id: "stable-ids",
        title: "Keep component order stable",
        explanation:
          "Field and overlay parts make matching IDs so labels, descriptions, triggers, and content can find each other. React can make those IDs match on server and client when the component tree has the same order. Avoid conditionally inserting a different first child only in the browser.",
        code: '// Keep this shape on server and client\n<TextField>\n  <Label>Name</Label>\n  <Input name="name" />\n</TextField>;',
        language: "tsx",
      },
    ],
  },
  {
    slug: "intelligent-ui",
    order: 8,
    title: "Intelligent UI",
    summary:
      "Let a model answer with real, accessible interfaces: charts, forms, and buttons that stream in safely.",
    sections: [
      {
        id: "what-it-is",
        title: "What Intelligent UI is",
        explanation:
          "Chat assistants are moving past walls of text. OpenAI's Intelligent UI in ChatGPT mixes prose with charts, forms, buttons, and small tools that appear while the answer streams, and a button press becomes the next turn of the conversation. Other efforts, from structured-output component catalogs to generative UI toolkits, share the idea: the model may only compose components your app registered, and your app renders them. The interface becomes part of the answer, and the model never ships code.",
        note: "Think of it as the model filling in a worksheet you designed. It can choose and arrange the boxes, but it cannot invent new kinds of box.",
      },
      {
        id: "how-comp0-fits",
        title: "How comp0 fits",
        explanation:
          "A model is a poor judge of accessibility, so comp0 makes it part of the contract. @comp0/genui is a model-facing layer on top of comp0 with no third-party runtime and no provider lock-in. Its catalog is a set of Zod schemas that are the single source of the validator, the JSON Schema for structured outputs, and the system prompt. Every control, chart, table, and image requires its accessible name, and a component without everything it requires is not drawn. Components render only the props their schema declares, so no model-provided style, event handler, or unsafe URL reaches the DOM.",
        code: 'import { catalog, genuiPrompt, responseJsonSchema } from "@comp0/genui";\n\ncatalog.map((entry) => entry.name); // Stack, Card, Select, BarChart, Table, ...\ngenuiPrompt(); // the system prompt that teaches a model the catalog\nresponseJsonSchema(); // the JSON Schema for structured outputs',
        language: "tsx",
      },
      {
        id: "install",
        title: "Install the packages",
        explanation:
          "Add the integration next to comp0 and the peers it asks you to own. Nothing here needs an API key: you bring your own model provider, and comp0 never calls one.",
        code: "pnpm add @comp0/genui @comp0/react zod react react-dom",
        language: "bash",
      },
      {
        id: "format",
        title: "The format the model writes",
        explanation:
          'A response is one JSON object, normally a Stack. Every component is an object with a type and its props inline, containers take children, and data such as options, chart points, or table rows is plain JSON. A control that other parts depend on writes a binding, { "$bind": "seats", "initial": 5 }, and a computed value writes an expression, { "$expr": "seats * 12" }, over the bound names. Expressions run in a small whitelisted evaluator with arithmetic, comparisons, and a few functions such as round and sum: there is no eval, no property access, and no way to reach globals.',
        code: '{\n  "type": "Stack",\n  "children": [\n    {\n      "type": "Slider",\n      "label": "Seats",\n      "name": "seats",\n      "min": 1,\n      "max": 25,\n      "value": { "$bind": "seats", "initial": 5 }\n    },\n    {\n      "type": "Output",\n      "label": "Cost for a year",\n      "value": { "$expr": "seats * 12 * 12" },\n      "unit": " USD"\n    }\n  ]\n}',
        language: "json",
      },
      {
        id: "system-prompt",
        title: "Teach the model the catalog",
        explanation:
          "genuiPrompt returns the format rules, the binding and expression rules, every component with its props, comp0's accessibility and safety rules, and worked JSON examples. Send it as the system message to any provider. Add your own rules with the rules option. The same text ships pre-generated as @comp0/genui/genui.prompt.md, and it is linked from llms.txt so coding assistants can read it too.",
        code: 'import { genuiPrompt } from "@comp0/genui";\n\nconst system = genuiPrompt({\n  preamble: "You are a travel assistant.",\n  rules: ["Prices are in euros."],\n});\n\n// Pass `system` as the system message to your provider\'s chat API.',
        language: "tsx",
      },
      {
        id: "structured-outputs",
        title: "Or constrain the model with a schema",
        explanation:
          "Providers that support structured outputs or tool calls can be held to the format. responseJsonSchema returns the recursive JSON Schema of one root component, where every component has its own definition so containers nest each other. Pass strict: true for strict structured outputs: every property becomes required, optional ones become nullable, and the keywords strict mode rejects are removed. The renderer treats null as left out, so a strict response renders as is. Rules a schema cannot express, such as unsafe URLs or unknown binding names, are still checked by the validator.",
        code: 'const response = await client.chat.completions.create({\n  model,\n  messages,\n  response_format: {\n    type: "json_schema",\n    json_schema: { name: "ui", strict: true, schema: responseJsonSchema({ strict: true }) },\n  },\n});',
        language: "tsx",
      },
      {
        id: "render-stream",
        title: "Render the stream",
        explanation:
          "Append each chunk your provider streams to a string and hand it to GenUI with streaming. The renderer parses the growing text on every update, so the interface appears top-down: the shell first, then the details. Any provider that can stream text works, so the loop below is yours to fill in. A model may wrap the JSON in a Markdown code fence; the parser skips it.",
        code: 'import { GenUI } from "@comp0/genui";\nimport { useEffect, useState } from "react";\n\nexport function Answer({ stream }: { stream: AsyncIterable<string> }) {\n  const [response, setResponse] = useState("");\n  const [streaming, setStreaming] = useState(true);\n\n  useEffect(() => {\n    (async () => {\n      for await (const chunk of stream) setResponse((text) => text + chunk);\n      setStreaming(false);\n    })();\n  }, [stream]);\n\n  return <GenUI response={response} streaming={streaming} />;\n}',
        language: "tsx",
        demo: "intelligent-ui",
      },
      {
        id: "actions",
        title: "Turn actions into the next turn",
        explanation:
          "A pressed button, chosen suggestion, or submitted form calls onAction with a message built from the visible labels, such as Plan: Pro; Seats: 5, and a form also reports its values by control name. Send the message as the next user message and the conversation continues. onStateChange and initialState let you save what the person typed and restore it later. When the finished response has problems, onError receives structured errors, and formatErrors turns them into a message you can send back to the model for a repair.",
        code: '<GenUI\n  response={response}\n  streaming={streaming}\n  onAction={(action) => ask([...history, { role: "user", text: action.message }])}\n  onStateChange={(state) => saveWithMessage(state)}\n  initialState={savedState}\n  onError={(errors) => ask([...history, { role: "user", text: formatErrors(errors) }])}\n/>;',
        language: "tsx",
      },
      {
        id: "guarantees",
        title: "What it guarantees",
        explanation:
          "Streaming: every prefix of a response renders without errors, warnings, or exceptions, components keep their identity as the response grows, and typed text and focus survive. While streaming, output sits in a BusyRegion marked aria-busy, partial data does not warn, focus never moves, and buttons and submits wait. When streaming ends the full response is validated once. Safety: only catalog components and declared props render, links accept http(s), mailto, tel, relative, and fragment URLs, images accept http(s) and relative URLs, and text is always text, never Markdown or HTML. Accessibility: names are required by schema, charts include a data table, and warnings and errors are announced at once.",
        note: "The renderer shows everything that is valid even when other parts are not: unknown components and props are left out and a prop of the wrong type is dropped.",
      },
      {
        id: "style-output",
        title: "Style the headless output",
        explanation:
          "comp0 ships no CSS. The layout components carry plain token attributes such as data-direction, data-gap, data-columns, and data-tone, and every part keeps its data-slot, so one stylesheet themes everything a model can compose. This page's demo does exactly that in Tailwind, in light and dark.",
        code: '[data-slot="stack"] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n\n[data-slot="grid"][data-columns="3"] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n}\n\n[data-slot="card"][data-tone="accent"] {\n  border-color: teal;\n}',
        language: "css",
      },
    ],
  },
];

export const learnBySlug = new Map(learnDocs.map((page) => [page.slug, page]));
