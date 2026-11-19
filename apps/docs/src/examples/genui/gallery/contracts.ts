import {
  actions,
  charts,
  composition,
  disclosure,
  forms,
  fromJsonSchema,
  layout,
  oneOf,
  spec,
  state,
  vocabulary,
} from "@comp0/genui/vocabulary";

const number = (minimum: number, maximum: number) =>
  fromJsonSchema<number>({ type: "integer", minimum, maximum });
const bool = fromJsonSchema<boolean>({ type: "boolean" });
const text = fromJsonSchema<string>({ type: "string" });
const ink = oneOf(["Vermilion", "Cobalt", "Fern"]);
const line = oneOf(["Harbour", "Forest", "Quarry"]);
const rows = number(2, 8);
const offset = number(0, 8);

export const printProof = spec("PrintProof", {
  description: "Overprint two ink plates with an offset measured in millimetres.",
  props: { ink, offset },
});
export const seatingPlan = spec("SeatingPlan", {
  description: "Draw six chair positions per row, leaving the middle two empty when aisle is true.",
  props: { rows, aisle: bool },
});
export const departures = spec("Departures", {
  description: "Read the last three departures from the station timetable for one line.",
  props: { line },
});

export const contracts = {
  "print-proof": composition({
    vocabulary: vocabulary(
      layout.only("Stack"),
      forms.only("Select", "Option", "Slider"),
      printProof,
    ),
    state: state({ ink, offset }, { ink: "Vermilion", offset: 3 }),
  }),
  "listening-room": composition({
    vocabulary: vocabulary(
      layout.only("Stack"),
      forms.only("Slider", "Switch"),
      charts.only("Output"),
      seatingPlan,
    ),
    state: state({ rows, aisle: bool }, { rows: 4, aisle: true }),
  }),
  soundcheck: composition({
    vocabulary: vocabulary(
      disclosure.only("Tabs", "TabList", "Tab", "TabPanel"),
      charts.only("BarChart"),
      layout.only("Text"),
    ),
  }),
  encore: composition({
    vocabulary: vocabulary(layout.only("Card", "List", "Item"), forms.only("TextField")),
  }),
  "night-train": composition({
    vocabulary: vocabulary(layout.only("Stack"), forms.only("Select", "Option"), departures),
    state: state({ line }, { line: "Harbour" }),
  }),
  backpack: composition({
    vocabulary: vocabulary(
      layout.only("Stack", "Text"),
      forms.only("Checkbox"),
      charts.only("Meter"),
    ),
    state: state(
      { camera: bool, recorder: bool, tripod: bool },
      { camera: true, recorder: false, tripod: false },
    ),
  }),
  "pour-over": composition({
    vocabulary: vocabulary(
      layout.only("Stack", "List", "Item"),
      forms.only("Slider"),
      charts.only("Output"),
    ),
    state: state({ beans: number(10, 40), ratio: number(14, 18) }, { beans: 20, ratio: 16 }),
  }),
  "field-notes": composition({
    vocabulary: vocabulary(
      layout.only("Stack"),
      charts.only("CitedText"),
      actions.only("CopyButton"),
    ),
  }),
  "museum-label": composition({
    vocabulary: vocabulary(layout.only("Heading", "Text"), disclosure.only("Disclosure")),
  }),
  "repair-desk": composition({
    vocabulary: vocabulary(layout.only("Stack", "Text"), forms.only("Form", "TextField")),
    state: state({ result: text }, { result: "Awaiting a ticket number." }),
  }),
};

export type CompositionSlug = keyof typeof contracts;
export function hasComposition(slug: string): slug is CompositionSlug {
  return Object.hasOwn(contracts, slug);
}
