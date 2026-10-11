// The disclosure facades' props, written with ArkType and precompiled into disclosure.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { list, nodes } from "../catalog/schema.js";

const tabProps = {
  label: type("string").describe("Visible text of the tab."),
  children: nodes("Content shown when the tab is selected."),
};

export const tabsProps = {
  "label?": type("string").describe("Accessible name of the tab list."),
  tabs: list(
    tabProps,
    "The tabs, each { label, children } where children are the components shown when the tab is selected.",
  ),
};

const accordionItemProps = {
  title: type("string").describe("Visible heading of the section; it toggles the section."),
  "open?": type("boolean").describe("Starts open."),
  children: nodes("Content revealed when the section is open."),
};

export const accordionProps = {
  "multiple?": type("boolean").describe("Allow several sections open at once."),
  items: list(accordionItemProps, "The sections, each { title, open?, children }."),
};

export const disclosureProps = {
  summary: type("string").describe("Visible text that toggles the details."),
  "open?": type("boolean").describe("Starts open."),
  children: nodes("Details revealed when opened."),
};
