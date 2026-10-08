import { component, p, prop } from "../define.js";

export default component({
  slug: "tabs",
  title: "Tabs",
  group: "navigation",
  summary: "A set of headings that swaps one panel at a time.",
  analogy: "Like tabs in a paper binder.",
  whenToUse: "Use it for peer sections where only one needs to be visible.",
  steps: {
    main: "Start Tabs with a starting value.",
    supporting: "Give each Tab and its TabPanel the same tab id.",
    behavior: "Put the Tab elements together inside TabList.",
    code: '<Tabs defaultValue="one">\n  <TabList>\n    <Tab value="one">One</Tab>\n  </TabList>\n  <TabPanel value="one">Panel one</TabPanel>\n</Tabs>;',
  },
  imports: ["Tab", "TabList", "TabPanel", "Tabs"],
  snippet:
    '<Tabs defaultValue="one">\n  <TabList>\n    <Tab value="one">One</Tab>\n  </TabList>\n  <TabPanel value="one">Panel one</TabPanel>\n</Tabs>;',
  parts: [
    p("Tabs", "root", "Selected-tab provider.", false, false, [
      prop("value / defaultValue", "string", "Controlled or initial selected tab."),
      prop("onChange", "(value: string) => void", "Receives the next selected tab."),
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's data attributes; without it the root renders no DOM and DOM props are a type error.",
      ),
    ]),
    p("TabList", "root", "Tab list element.", true, false, [
      prop("aria-label", "string", "Names the tab list for assistive technology."),
      prop("orientation", '"horizontal" | "vertical"', "Arrow-key axis and aria-orientation."),
    ]),
    p("Tab", "item", "Native button with tab role.", true, false, [
      prop("value", "string", "Identity that pairs this tab with its panel."),
      prop("disabled", "boolean", "Disables the tab."),
      prop("as", "ElementType | Fragment", "Renders another element with tab behavior attached."),
    ]),
    p("TabPanel", "region", "Panel for a matching tab.", true, false, [
      prop("value", "string", "The tab this panel belongs to."),
    ]),
  ],
  keyboard: [
    {
      keys: ["ArrowRight"],
      action: "Moves to and selects the tab on the visual right.",
      scope: "horizontal",
    },
    {
      keys: ["ArrowLeft"],
      action: "Moves to and selects the tab on the visual left.",
      scope: "horizontal",
    },
    { keys: ["ArrowDown"], action: "Moves to and selects the next tab.", scope: "vertical" },
    { keys: ["ArrowUp"], action: "Moves to and selects the previous tab.", scope: "vertical" },
    { keys: ["Home"], action: "Moves to and selects the first tab." },
    { keys: ["End"], action: "Moves to and selects the last tab." },
  ],
  stateHooks: [
    {
      attribute: "[data-selected]",
      on: "Tab, TabPanel",
      meaning: "This tab or panel is selected.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Keep tab names short and distinct.",
    "Ensure each Tab has a matching TabPanel key.",
    "Horizontal arrows follow visual direction: Right moves forward in LTR and Left moves forward in RTL.",
    "Do not use tabs to hide unrelated page navigation.",
  ],
  related: ["accordion", "list-box"],
});
