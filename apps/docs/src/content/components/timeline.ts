import { component, p, prop } from "../define.js";

export default component({
  slug: "timeline",
  title: "Timeline",
  group: "navigation",
  summary: "A semantic ordered list of events in chronological order.",
  analogy: "Like a flight log: each entry says what happened and exactly when.",
  whenToUse: "Use it for history, releases, deliveries, and other sequences where order matters.",
  steps: {
    main: "Start Timeline with an aria-label that names the sequence.",
    supporting: "Add one TimelineItem per event and put TimelineTime beside the event summary.",
    behavior:
      "Use dateTime for the machine-readable timestamp and format the visible time for people.",
    code: '<Timeline aria-label="Release history">\n  <TimelineItem>\n    <TimelineTime dateTime="2026-07-14T09:15:00Z">09:15</TimelineTime>Deployed\n  </TimelineItem>\n</Timeline>;',
  },
  imports: ["Timeline", "TimelineItem", "TimelineTime"],
  snippet:
    '<Timeline aria-label="Release history"><TimelineItem><TimelineTime dateTime="2026-07-14T09:15:00Z">09:15</TimelineTime><h3>Deployed</h3></TimelineItem></Timeline>',
  parts: [
    p("Timeline", "root", "Native ordered list for a chronological sequence.", true, false, [
      prop(
        "aria-label / aria-labelledby",
        "string",
        "Names the sequence when a nearby heading does not.",
      ),
      prop(
        "as",
        "ElementType",
        "Renders another element in place of the default; Fragment merges the props into its single child.",
      ),
    ]),
    p("TimelineItem", "item", "Native list item for one dated event.", true, false),
    p(
      "TimelineTime",
      "value",
      "Native time element carrying a machine-readable dateTime value.",
      true,
      false,
      [prop("dateTime", "string", "Machine-readable ISO date or time for the visible label.")],
    ),
  ],
  keyboard: [],
  stateHooks: [],
  form: "Timeline is descriptive content and does not create form values.",
  accessibility: [
    "Give the ordered list a name when the surrounding heading does not already do so.",
    "Use a machine-readable dateTime value on TimelineTime and keep its visible text understandable in context.",
    "Do not use the visual line or dots as the only way to convey order; the native ordered list supplies that relationship.",
  ],
  related: ["feed", "messages"],
});
