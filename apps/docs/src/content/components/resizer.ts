import { component, p, prop } from "../define.js";

export default component({
  slug: "resizer",
  title: "Resizer",
  group: "navigation",
  summary: "A separator you drag or arrow to resize the thing beside it.",
  analogy: "Like the divider bar between two window panes.",
  whenToUse: "Use it for adjustable panes and composable column resizing.",
  steps: {
    main: "Place Resizer inside the element it should resize.",
    supporting: "Keep the size in your state: pass size and apply it back as a style.",
    behavior: "Set min and max so dragging and End or Home stay inside sane bounds.",
    code: "<Resizer size={width} min={120} max={320} onResize={setWidth} />;",
  },
  imports: ["Resizer"],
  snippet: "<Resizer size={width} min={120} max={320} onResize={setWidth} />;",
  parts: [
    p("Resizer", "root", "Native separator that resizes its target.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop(
        "orientation",
        '"vertical" | "horizontal"',
        "Vertical resizes width; horizontal resizes height.",
      ),
      prop(
        "onResize",
        "(size: number) => void",
        "Receives the next size; you apply it as a style.",
      ),
      prop("size", "number", "Current size, exposed as aria-valuenow."),
      prop("min / max", "number", "Clamp bounds, also used by Home and End."),
      prop(
        "target",
        "RefObject<HTMLElement>",
        "Element to measure; defaults to the parent or the table column.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowRight"], action: "Widens a vertical split." },
    { keys: ["ArrowLeft"], action: "Narrows a vertical split." },
    { keys: ["ArrowDown"], action: "Grows a horizontal split." },
    { keys: ["ArrowUp"], action: "Shrinks a horizontal split." },
    { keys: ["Home"], action: "Jumps to the minimum size." },
    { keys: ["End"], action: "Jumps to the maximum size." },
  ],
  stateHooks: [
    { attribute: "[data-dragging]", on: "Resizer", meaning: "A pointer drag is in progress." },
    { attribute: ":focus-visible", on: "Resizer", meaning: "The separator has keyboard focus." },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Keep the handle large enough to grab; style the drag state via data-dragging.",
    "Pass size so assistive technology hears the separator position.",
    "Inside a resizable TableColumn the handle hides itself; keyboard resizing stays on the header.",
  ],
  related: ["table"],
});
