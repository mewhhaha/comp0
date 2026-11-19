import {
  composition,
  forms,
  fromJsonSchema,
  layout,
  state,
  vocabulary,
} from "@comp0/genui/vocabulary";

export const ui = composition({
  vocabulary: vocabulary(layout.only("Stack", "Text"), forms.only("Slider")),
  state: state({ seats: fromJsonSchema<number>({ type: "number" }) }, { seats: 2 }),
});
