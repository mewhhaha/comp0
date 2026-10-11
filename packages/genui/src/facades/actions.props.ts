// Generated from actions.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { fromJsonSchema, list, oneOf, url } from "../catalog/schema.js";

export const stepProps = {
  "call?": fromJsonSchema<string>({
    type: "string",
    description: "Name of a host tool to call, from the list of tools.",
  }),
  "args?": fromJsonSchema<Record<string, unknown>>({
    type: "object",
    description: 'Arguments for the tool; any value may be {"$bind": name} or {"$expr": "..."}.',
    additionalProperties: {},
  }),
  "into?": fromJsonSchema<string>({
    type: "string",
    description: "Name to store the tool's result under, for bound props.",
  }),
  "set?": fromJsonSchema<string>({ type: "string", description: "Name of a value to set." }),
  "value?": fromJsonSchema<unknown>({
    description: 'The value to set; may be {"$bind": name} or {"$expr": "..."}.',
  }),
  "send?": fromJsonSchema<string>({
    type: "string",
    description: "A message to send to the assistant as the person's next turn.",
  }),
};
export const buttonProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible text of the button; say what happens when it is pressed.",
  }),
  "variant?": oneOf(
    ["primary", "secondary", "danger"],
    '"primary" for the main action; "danger" for destructive ones.',
  ),
  "message?": fromJsonSchema<string>({
    type: "string",
    description:
      "What the person is asking for, written as their message to the assistant. Defaults to the label.",
  }),
  "action?": list(
    {
      "call?": fromJsonSchema<string>({
        type: "string",
        description: "Name of a host tool to call, from the list of tools.",
      }),
      "args?": fromJsonSchema<Record<string, unknown>>({
        type: "object",
        description:
          'Arguments for the tool; any value may be {"$bind": name} or {"$expr": "..."}.',
        additionalProperties: {},
      }),
      "into?": fromJsonSchema<string>({
        type: "string",
        description: "Name to store the tool's result under, for bound props.",
      }),
      "set?": fromJsonSchema<string>({ type: "string", description: "Name of a value to set." }),
      "value?": fromJsonSchema<unknown>({
        description: 'The value to set; may be {"$bind": name} or {"$expr": "..."}.',
      }),
      "send?": fromJsonSchema<string>({
        type: "string",
        description: "A message to send to the assistant as the person's next turn.",
      }),
    },
    "Steps to run in order when pressed, instead of sending the message: call a tool, set a value, send a message. Stops at the first that fails.",
  ),
};
export const linkProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible link text that makes sense out of context.",
  }),
  href: url(
    "link",
    "http(s), mailto:, tel:, relative, or #fragment URL. Other schemes are not linked.",
  ),
};
export const suggestionsProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Names the group of replies, such as 'Follow-up questions'. Required.",
  }),
  items: fromJsonSchema<string[]>({
    type: "array",
    description:
      "Short replies the person can send as their next message, each a sentence or less.",
    items: { type: "string" },
  }),
};
export const copyButtonProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible text saying what is copied, such as 'Copy install command'.",
  }),
  value: fromJsonSchema<string>({
    type: "string",
    description: "The exact text placed on the clipboard.",
  }),
};
