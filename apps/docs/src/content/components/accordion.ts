import { component, p, prop } from "../define.js";

export default component({
  slug: "accordion",
  title: "Accordion",
  group: "navigation",
  summary: "A stack of expandable answers.",
  analogy: "Like a row of envelopes: open the one you want to read.",
  whenToUse: "Use it to hide optional detail while keeping headings visible.",
  steps: {
    main: "Start Accordion with one AccordionItem and value.",
    supporting: "Put Header and Trigger before the matching Panel.",
    behavior: "Use defaultValue for the item that should begin open.",
    code: '<Accordion defaultValue="one">\n  <AccordionItem value="one">\n    <AccordionHeader>\n      <AccordionTrigger>Details</AccordionTrigger>\n    </AccordionHeader>\n    <AccordionPanel>More information.</AccordionPanel>\n  </AccordionItem>\n</Accordion>;',
  },
  imports: ["Accordion", "AccordionHeader", "AccordionItem", "AccordionPanel", "AccordionTrigger"],
  snippet:
    '<Accordion defaultValue="one">\n  <AccordionItem value="one">\n    <AccordionHeader>\n      <AccordionTrigger>Details</AccordionTrigger>\n    </AccordionHeader>\n    <AccordionPanel>More information.</AccordionPanel>\n  </AccordionItem>\n</Accordion>;',
  parts: [
    p("Accordion", "root", "Open-item state provider.", false, false, [
      prop("type", '"single" | "multiple"', "How many items may stay open."),
      prop("value / defaultValue", "string | string[]", "Controlled or initial open items."),
      prop("onChange", "(value) => void", "Receives the next open items."),
      prop("collapsible", "boolean", "Allows closing the last open item."),
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's data attributes; without it the root renders no DOM and DOM props are a type error.",
      ),
    ]),
    p("AccordionItem", "item", "Owns an item wrapper.", true, false, [
      prop("value", "string", "Identity used by the root’s open state."),
      prop("disabled", "boolean", "Disables the item."),
    ]),
    p("AccordionHeader", "label", "Heading wrapper.", true, false, [
      prop("level", "1 | 2 | 3 | 4 | 5 | 6", "Heading element to render; defaults to h3."),
    ]),
    p("AccordionTrigger", "trigger", "Native button that opens its panel.", true, false, [
      prop("disabled", "boolean", "Disables this trigger on top of the item's disabled state."),
    ]),
    p("AccordionPanel", "region", "Revealed region.", true, false, [
      prop("role", '"region" | "group"', "Use group when many panels would flood landmarks."),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Moves to next trigger." },
    { keys: ["ArrowUp"], action: "Moves to previous trigger." },
    { keys: ["Home"], action: "Moves to the first trigger." },
    { keys: ["End"], action: "Moves to the last trigger." },
    { keys: ["Enter"], action: "Toggles the item." },
    { keys: ["Space"], action: "Toggles the item." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "AccordionItem, AccordionTrigger, AccordionPanel",
      meaning: "The item is expanded.",
    },
    {
      attribute: "[data-disabled]",
      on: "AccordionItem, AccordionTrigger",
      meaning: "The trigger is disabled.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Write trigger headings that describe the hidden content.",
    "Keep the expanded state visually clear.",
    "Do not hide important error messages inside a collapsed item.",
  ],
  related: ["disclosure", "tabs"],
});
