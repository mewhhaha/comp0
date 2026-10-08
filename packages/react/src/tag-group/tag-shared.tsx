import { type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type TagGroupContextValue = {
  selectionEnabled: boolean;
  selected: string[];
  toggle: (value: string) => void;
  remove: ((value: string) => void) | undefined;
};

export type TagListContextValue = {
  activeKey: string;
  setActiveKey: (key: string) => void;
  /** Registers or updates one tag; registering an unchanged tag is a no-op. */
  register: (item: CollectionItem) => void;
  /** Removes a tag, but only while `element` is still the registered one. */
  unregister: (key: string, element: HTMLElement) => void;
};

export const [TagGroupContext, useTagGroupContext, useOptionalTagGroupContext] =
  createRequiredContext<TagGroupContextValue>("TagGroup");
export const [TagListContext, useTagListContext] =
  createRequiredContext<TagListContextValue>("TagList");
