import {
  builtInVocabulary,
  composition,
  fromJsonSchema,
  oneOf,
  spec,
  state,
  vocabulary,
} from "@comp0/genui/vocabulary";

const number = fromJsonSchema<number>({ type: "number" });
const text = fromJsonSchema<string>({ type: "string" });
const city = oneOf(["Oslo", "Lisbon", "Tokyo", "Nairobi"]);
export const shaderSpec = spec("Shader", {
  description:
    "A live plasma shader that follows the declared speed, scale, and hue values locally. Place sliders bound to those names beside it.",
  props: {},
});
export const forecastSpec = spec("Forecast", {
  description:
    "A seven-day forecast chart for a city. Bind its city prop to state to update the chart.",
  props: { city },
});

export const labState = state(
  {
    city,
    speed: number,
    scale: number,
    hue: number,
    email: text,
    subscription: text,
  },
  { city: "Oslo", speed: 1, scale: 4, hue: 200, email: "", subscription: "" },
);
export const labUI = composition({
  vocabulary: vocabulary(builtInVocabulary, shaderSpec, forecastSpec),
  state: labState,
});
