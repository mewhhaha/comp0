// The disclosure facades' props, written with ArkType and precompiled into disclosure.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { list, nodes } from "../catalog/schema.js";

const tabProps = {
  label: type("string").describe("Visible text of the tab."),
  children: nodes("Content shown when the tab is selected."),
};

export const tabsProps = {
  tabs: list(
    tabProps,
    "The tabs, each { label, children } where children are the components shown when the tab is selected.",
  ),
  "label?": type("string").describe("Accessible name of the tab list."),
};

const accordionItemProps = {
  title: type("string").describe("Visible heading of the section; it toggles the section."),
  children: nodes("Content revealed when the section is open."),
  "open?": type("boolean").describe("Starts open."),
};

export const accordionProps = {
  items: list(accordionItemProps, "The sections, each { title, children, open? }."),
  "multiple?": type("boolean").describe("Allow several sections open at once."),
};

export const disclosureProps = {
  summary: type("string").describe("Visible text that toggles the details."),
  children: nodes("Details revealed when opened."),
  "open?": type("boolean").describe("Starts open."),
};
