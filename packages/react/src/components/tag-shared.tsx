import { createContext } from "react";
import { type CollectionItemRecord } from "./collection-shared.js";

export interface TagGroupContextValue {
  selectionEnabled: boolean;
  selected: string[];
  toggle: (value: string) => void;
  remove: ((value: string) => void) | undefined;
}

export interface TagListContextValue {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
}

export const TagGroupContext = createContext<TagGroupContextValue | null>(null);
export const TagListContext = createContext<TagListContextValue | null>(null);
