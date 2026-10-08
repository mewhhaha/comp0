import { component, p, prop } from "../define.js";

export default component({
  slug: "link",
  title: "Link",
  group: "actions",
  summary: "A real anchor for travelling to another URL.",
  analogy: "Like a signpost that points somewhere else.",
  whenToUse: "Use it when the result is navigation, not a local action.",
  steps: {
    main: "Add Link at the place people need to leave from.",
    supporting: "Set href to the real destination.",
    behavior: "Use words that say where the destination is.",
    code: '<Link href="/settings">Settings</Link>;',
  },
  imports: ["Link"],
  snippet: '<Link href="/settings">Settings</Link>;',
  parts: [
    p("Link", "root", "Native anchor element.", true, false, [
      prop("href", "string", "Destination URL; removed while disabled."),
      prop("target / rel", "string", "Native anchor behavior for new tabs and referrers."),
      prop("disabled", "boolean", "Removes the link from the tab order and blocks clicks."),
      prop("as", "ElementType", "Renders another element with link semantics restored."),
    ]),
  ],
  keyboard: [{ keys: ["Enter"], action: "Follows the link." }],
  stateHooks: [
    { attribute: "[data-disabled]", on: "Link", meaning: "The link is unavailable." },
    { attribute: "[data-focused]", on: "Link", meaning: "The link has focus." },
    {
      attribute: "[data-focus-visible]",
      on: "Link",
      meaning: "Focus should show a visible ring.",
    },
    { attribute: "[data-hovered]", on: "Link", meaning: "A non-touch pointer is over it." },
  ],
  form: "Links do not submit forms.",
  accessibility: [
    "Make link text say where it goes.",
    "Do not use a Link for an in-page action.",
    "Keep the current page identifiable in a breadcrumb trail.",
    "For a linked surface, keep additional controls as siblings of the stretched anchor and layer them above its pseudo-element; interactive controls must never be nested inside the anchor.",
  ],
  related: ["button", "breadcrumbs"],
  moreExamples: [
    {
      id: "linked-surface",
      title: "Linked property cards",
      description:
        "Stretch one native title link across each property while keeping its save toggle independently interactive.",
    },
  ],
});
