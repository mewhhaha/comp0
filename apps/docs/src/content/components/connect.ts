import { component, p, prop } from "../define.js";

export default component({
  slug: "connect",
  title: "Connect",
  group: "navigation",
  summary: "Cards with typed inputs and outputs that people can connect, inspect, and disconnect.",
  analogy:
    "Like plugging labelled cables between instruments: the socket tells you which cable fits.",
  whenToUse:
    "Use it for visual workflows, material editors, and other relationships that people need to edit directly.",
  steps: {
    main: "Wrap labelled ConnectCard elements in Connect and assign a unique value to every input and every output.",
    supporting:
      "Add ConnectOutput buttons and ConnectInput groups with matching kind strings. Each input contains a ConnectInputTrigger, ConnectInputSelect, and ConnectDisconnect.",
    behavior:
      "Add ConnectLines for decorative wires and make native source selectors easy to find. Let your own layout or Inventory position the cards; Connect never opens a dialog or moves focus on mount.",
    code: '<Connect aria-label="Connections">\n  <ConnectCard value="source" label="Palette">\n    <ConnectOutput value="color" label="Color" kind="color">\n      Color\n    </ConnectOutput>\n  </ConnectCard>\n  <ConnectCard value="target" label="Material">\n    <ConnectInput value="surface" label="Surface" kind="color">\n      <ConnectInputTrigger>Surface</ConnectInputTrigger>\n      <ConnectInputSelect />\n      <ConnectDisconnect>Disconnect</ConnectDisconnect>\n    </ConnectInput>\n  </ConnectCard>\n</Connect>;',
  },
  imports: [
    "Connect",
    "ConnectCard",
    "ConnectOutput",
    "ConnectInput",
    "ConnectInputTrigger",
    "ConnectInputSelect",
    "ConnectDisconnect",
    "ConnectLines",
  ],
  snippet:
    '<Connect aria-label="Connections"><ConnectCard value="source" label="Palette"><ConnectOutput value="color" label="Color" kind="color">Color</ConnectOutput></ConnectCard><ConnectCard value="target" label="Material"><ConnectInput value="surface" label="Surface" kind="color"><ConnectInputTrigger>Surface</ConnectInputTrigger><ConnectInputSelect /><ConnectDisconnect>Disconnect</ConnectDisconnect></ConnectInput></ConnectCard></Connect>',
  parts: [
    p(
      "Connect",
      "root",
      "Native group owning connection state and polite announcements.",
      true,
      false,
      [
        prop(
          "value",
          "readonly ConnectConnection[]",
          "Controlled connections, each { from, to }. One source per input; outputs may feed multiple inputs.",
        ),
        prop("defaultValue", "readonly ConnectConnection[]", "Initial uncontrolled connections."),
        prop(
          "onChange",
          "(connections: readonly ConnectConnection[]) => void",
          "Receives the complete proposed connections. Layout and application rules remain with the caller.",
        ),
        prop("aria-label", "string", "Names this set of connections."),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
    p(
      "ConnectLines",
      "graphic",
      "Optional, aria-hidden SVG wires that follow layout, size, and scrolling changes.",
      true,
      true,
    ),
    p(
      "ConnectCard",
      "item",
      "Labelled native fieldset containing a card's ports and other controls.",
      true,
      false,
      [
        prop("value", "string", "Unique card identity; ports on the same card cannot connect."),
        prop("label", "string", "Card name included in port and source labels."),
        prop(
          "tabIndex",
          "number",
          "Defaults to 0 for card navigation. Use -1 when a surrounding composite owns navigation.",
        ),
      ],
    ),
    p("ConnectOutput", "trigger", "Button that selects a source or starts a drag.", true, false, [
      prop("value", "string", "Nonempty identity unique among outputs."),
      prop("label", "string", "Human-readable output name."),
      prop("kind", "string", "Human-readable type, matched exactly against an input's kind."),
      prop(
        "disabled",
        "boolean",
        "Prevents choosing this output and removes it from available sources.",
      ),
    ]),
    p("ConnectInput", "item", "Input context and wire endpoint around its controls.", true, false, [
      prop("value", "string", "Nonempty identity unique among inputs."),
      prop("label", "string", "Human-readable input name."),
      prop("kind", "string", "Accepted output type."),
      prop("disabled", "boolean", "Disables the input's controls and rejects connections."),
    ]),
    p("ConnectInputTrigger", "trigger", "Button that accepts a selected compatible output."),
    p(
      "ConnectInputSelect",
      "input",
      "Native source selector with compatible outputs and a Not connected option.",
    ),
    p("ConnectDisconnect", "trigger", "Button that removes this input's current source."),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Visits cards and their native controls in DOM order." },
    {
      keys: ["Enter", "Space"],
      action: "Selects an output or connects the selected output to a compatible input.",
      scope: "on port buttons",
    },
    { keys: ["Escape"], action: "Cancels connection selection and returns focus to its output." },
    {
      keys: ["ArrowUp", "ArrowDown"],
      action: "Focuses the previous or next card.",
      scope: "on ConnectCard itself",
    },
    {
      keys: ["Home", "End"],
      action: "Focuses the first or last card.",
      scope: "on ConnectCard itself",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-from] / [data-to]",
      on: "ConnectLines",
      meaning:
        "Each wire path names the output and input it joins, so one connection can be styled.",
    },
    {
      attribute: "[data-selected]",
      on: "ConnectOutput",
      meaning: "This output is waiting for an input.",
    },
    {
      attribute: "[data-available]",
      on: "ConnectInputTrigger",
      meaning: "This input accepts the selected output.",
    },
    {
      attribute: "[data-connected]",
      on: "ConnectOutput / ConnectInput / ConnectInputTrigger",
      meaning: "This port has a connection.",
    },
  ],
  form: "No implicit form serialization. Persist connections through value/onChange; ordinary controls inside cards retain their native behavior.",
  accessibility: [
    "Use visible card and port labels. ConnectCard renders a fieldset, not a dialog, and never takes focus on mount. Labels and kind strings supply contextual accessible names.",
    "Always include ConnectInputSelect and ConnectDisconnect for each input. Their native controls expose current sources and support editing without dragging or interpreting the wires.",
    "Click or tap an output, then a matching input. Enter and Space activate the same buttons; Escape cancels and returns focus to the selected output. Dragging is an additional path.",
    "ConnectLines is decorative and aria-hidden. Port descriptions persistently name connected endpoints, while a polite live region announces edits. Do not rely on wire color to explain types or relationships.",
    "Tab follows the DOM and retains native control behavior. Up, Down, Home, and End navigate cards only when the card itself has focus. When composing with Inventory, give ConnectCard tabIndex={-1} and let Inventory own spatial navigation.",
    "Inputs accept one output of the same kind from a different card; outputs may feed several inputs. Cycles are allowed. Applications that require an acyclic workflow must veto invalid proposals through controlled value/onChange.",
    "Keep cards mounted regardless of viewport visibility. Offer a stacked Cards view for small screens and a scrollable Canvas for spatial editing. Give touch controls at least 44 pixels of space and apply touch-action: none to move and resize grips so browser scrolling does not cancel gestures. Provide visible position and size controls as an alternative to dragging.",
  ],
  related: ["inventory", "floating-panel", "select"],
  moreExamples: [
    {
      id: "shader",
      title: "Shader connections",
      description: "A compact shader graph. Tap or drag to connect.",
    },
  ],
});
