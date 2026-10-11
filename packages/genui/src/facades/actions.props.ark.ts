// The actions facades' props, written with ArkType and precompiled into actions.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { list, oneOf, url } from "../catalog/schema.js";
import { variants } from "./tokens.js";

/** One step of an action; a step does one of call, set, or send. */
export const stepProps = {
  "call?": type("string").describe("Name of a host tool to call, from the list of tools."),
  "args?": type("Record<string, unknown>").describe(
    'Arguments for the tool; any value may be {"$bind": name} or {"$expr": "..."}.',
  ),
  "into?": type("string").describe("Name to store the tool's result under, for bound props."),
  "set?": type("string").describe("Name of a value to set."),
  "value?": type("unknown").describe(
    'The value to set; may be {"$bind": name} or {"$expr": "..."}.',
  ),
  "send?": type("string").describe("A message to send to the assistant as the person's next turn."),
};

export const buttonProps = {
  label: type("string").describe(
    "Visible text of the button; say what happens when it is pressed.",
  ),
  "variant?": oneOf(variants, '"primary" for the main action; "danger" for destructive ones.'),
  "message?": type("string").describe(
    "What the person is asking for, written as their message to the assistant. Defaults to the label.",
  ),
  "action?": list(
    stepProps,
    "Steps to run in order when pressed, instead of sending the message: call a tool, set a value, send a message. Stops at the first that fails.",
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
