// The feedback facades' props, written with ArkType and precompiled into feedback.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { oneOf } from "../catalog/schema.js";
import { alertTones } from "./tokens.js";

export const alertProps = {
  message: type("string").describe("What the person needs to know, in a sentence or two."),
  "tone?": oneOf(alertTones, '"info" by default.'),
  "title?": type("string").describe("Short bold lead-in."),
};

export const separatorProps = {
  "orientation?": oneOf(["horizontal", "vertical"], '"horizontal" by default.'),
};
