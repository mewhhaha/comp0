import { component, p, prop } from "../define.js";

export default component({
  slug: "slider",
  title: "Slider",
  group: "fields",
  summary: "A native range control for a value along a track.",
  analogy: "Like a dimmer rail from quiet to loud.",
  whenToUse: "Use it when a range is easy to understand by position.",
  steps: {
    main: "Add Slider with a visible label.",
    supporting: "Set min, max, and step to make the range honest.",
    behavior: "Name it if the chosen value belongs in a form.",
    code: '<Slider name="volume" defaultValue={30} min={0} max={100} />;',
  },
  imports: ["Slider"],
  snippet: '<Slider name="volume" defaultValue={30} min={0} max={100} />;',
  parts: [
    p("Slider", "input", "Native range input.", true, false, [
      prop("value / defaultValue", "number", "Controlled or initial position."),
      prop("onChange", "(value: number) => void", "Receives the next position."),
      prop("min / max / step", "number", "Range bounds; default 0, 100, and 1."),
      prop("name", "string", "Submission name for the value."),
      prop("disabled", "boolean", "Disables the slider."),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowRight", "ArrowUp"], action: "Increases the value." },
    { keys: ["ArrowLeft", "ArrowDown"], action: "Decreases the value." },
    { keys: ["Home"], action: "Moves to minimum." },
    { keys: ["End"], action: "Moves to maximum." },
  ],
  stateHooks: [{ attribute: "[data-disabled]", on: "Slider", meaning: "The slider is disabled." }],
  form: "Submits as a named native range input.",
  accessibility: [
    "Give the range a visible name.",
    "Make minimum, maximum, and current meaning understandable.",
    "Prefer NumberField when exact typing matters more than quick adjustment.",
  ],
  related: ["number-field", "switch"],
});
