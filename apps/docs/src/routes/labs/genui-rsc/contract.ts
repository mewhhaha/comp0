import {
  builtInVocabulary,
  fromJsonSchema,
  oneOf,
  spec,
  state,
  vocabulary,
} from "@comp0/genui/vocabulary";

const number = fromJsonSchema<number>({ type: "number" });
const text = fromJsonSchema<string>({ type: "string" });
export const forecastProps = { city: oneOf(["Oslo", "Lisbon", "Tokyo", "Nairobi"]) };
export const forecastDescription =
  "A seven-day forecast chart for a city. Read city from declared state to refresh just this component when it changes.";
export const shaderSpec = spec("Shader", {
  description:
    "A live plasma shader that follows the declared speed, scale, and hue values locally. Place sliders bound to those names beside it.",
  props: {},
});
export const forecastSpec = spec("Forecast", {
  description: forecastDescription,
  props: forecastProps,
});

export const labState = state(
  {
    city: forecastProps.city,
    speed: number,
    scale: number,
    hue: number,
    email: text,
    subscription: text,
  },
  { city: "Oslo", speed: 1, scale: 4, hue: 200, email: "", subscription: "" },
);
export const labVocabulary = vocabulary(builtInVocabulary, shaderSpec, forecastSpec);
