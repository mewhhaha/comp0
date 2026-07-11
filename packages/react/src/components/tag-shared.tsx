import { createContext } from "react";
import { type CollectionItemRecord } from "./collection-shared.js";

export interface TagGroupContextValue {
  selectionEnabled: boolean;
  selected: string[];
  activeKey: string;
  setActiveKey: (key: string) => void;
  toggle: (value: string) => void;
  remove: ((value: string) => void) | undefined;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
}

export const TagGroupContext = createContext<TagGroupContextValue | null>(null);
