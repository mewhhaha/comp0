import { createContext } from "react";
import { type SelectableCollectionContextValue } from "./collection-shared.js";

export const GridListContext = createContext<SelectableCollectionContextValue | null>(null);

export const FOCUSABLE_SELECTOR =
  "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]";

/** The focusable elements inside a row, excluding the row itself. */
export function rowFocusables(row: HTMLElement) {
  return [...row.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => element !== row,
  );
}
