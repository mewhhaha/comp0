import { type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type ListBoxContextValue = {
  activeKey: string;
  selectedKey: string;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  close?: (() => void) | undefined;
  /** Registers, updates, or (with a null element) unregisters one item. */
  register: (item: CollectionItem) => void;
  items: () => CollectionItem[];
};

export const [ListBoxContext, useListBoxContext, useOptionalListBoxContext] =
  createRequiredContext<ListBoxContextValue>("ListBox");
