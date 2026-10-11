// The actions facades' props, written with ArkType and precompiled into actions.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { oneOf, url } from "../catalog/schema.js";
import { variants } from "./tokens.js";

export const buttonProps = {
  label: type("string").describe(
    "Visible text of the button; say what happens when it is pressed.",
  ),
  "variant?": oneOf(variants, '"primary" for the main action; "danger" for destructive ones.'),
  "message?": type("string").describe(
    "What the person is asking for, written as their message to the assistant. Defaults to the label.",
  ),
};

export const linkProps = {
  label: type("string").describe("Visible link text that makes sense out of context."),
  href: url(
    "link",
    "http(s), mailto:, tel:, relative, or #fragment URL. Other schemes are not linked.",
  ),
};

export const suggestionsProps = {
  label: type("string").describe(
    "Names the group of replies, such as 'Follow-up questions'. Required.",
  ),
  items: type("string[]").describe(
    "Short replies the person can send as their next message, each a sentence or less.",
  ),
};

export const copyButtonProps = {
  label: type("string").describe(
    "Visible text saying what is copied, such as 'Copy install command'.",
  ),
  value: type("string").describe("The exact text placed on the clipboard."),
};
