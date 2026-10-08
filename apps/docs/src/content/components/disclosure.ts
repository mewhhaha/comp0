import { component, p, prop } from "../define.js";

export default component({
  slug: "disclosure",
  title: "Disclosure",
  group: "navigation",
  summary: "One button that shows or hides its own extra content.",
  analogy: "Like lifting one flap on a greeting card.",
  whenToUse: "Use it for one small optional detail.",
  steps: {
    main: "Start Disclosure with DisclosureTrigger.",
    supporting: "Put DisclosurePanel immediately after the trigger.",
    behavior: "Use defaultOpen when the detail should start visible.",
    code: "<Disclosure>\n  <DisclosureTrigger>Details</DisclosureTrigger>\n  <DisclosurePanel>More information.</DisclosurePanel>\n</Disclosure>;",
  },
  imports: ["Disclosure", "DisclosurePanel", "DisclosureTrigger"],
  snippet:
    "<Disclosure>\n  <DisclosureTrigger>Details</DisclosureTrigger>\n  <DisclosurePanel>More information.</DisclosurePanel>\n</Disclosure>;",
  parts: [
    p("Disclosure", "root", "Native details element that owns the open state.", true, false, [
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p("DisclosureTrigger", "trigger", "Native summary element that toggles the details."),
    p("DisclosurePanel", "region", "Revealed content."),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Toggles the panel." },
    { keys: ["Space"], action: "Toggles the panel." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "Disclosure, DisclosureTrigger, DisclosurePanel",
      meaning: "The disclosure is open.",
    },
    { attribute: ":open", on: "Disclosure", meaning: "Native details pseudo-class equivalent." },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Use trigger text that says what will appear.",
    "Keep open and closed state visible.",
    "Do not put a nested interactive control inside the trigger.",
  ],
  related: ["accordion", "popover"],
});
