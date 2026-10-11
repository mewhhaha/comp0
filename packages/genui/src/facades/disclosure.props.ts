// Generated from disclosure.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { fromJsonSchema, list, nodes } from "../catalog/schema.js";

export const tabsProps = {
  "label?": fromJsonSchema<string>({
    type: "string",
    description: "Accessible name of the tab list.",
  }),
  tabs: list(
    {
      label: fromJsonSchema<string>({ type: "string", description: "Visible text of the tab." }),
      children: nodes("Content shown when the tab is selected."),
    },
    "The tabs, each { label, children } where children are the components shown when the tab is selected.",
  ),
};
export const accordionProps = {
  "multiple?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "Allow several sections open at once.",
  }),
  items: list(
    {
      title: fromJsonSchema<string>({
        type: "string",
        description: "Visible heading of the section; it toggles the section.",
      }),
      "open?": fromJsonSchema<boolean>({ type: "boolean", description: "Starts open." }),
      children: nodes("Content revealed when the section is open."),
    },
    "The sections, each { title, open?, children }.",
  ),
};
export const disclosureProps = {
  summary: fromJsonSchema<string>({
    type: "string",
    description: "Visible text that toggles the details.",
  }),
  "open?": fromJsonSchema<boolean>({ type: "boolean", description: "Starts open." }),
  children: nodes("Details revealed when opened."),
};
