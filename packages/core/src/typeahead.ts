import { useEffect, useRef } from "react";

/** The search fields needed to match a collection item by typed text. */
export type TypeaheadItem = {
  key: string;
  textValue: string;
  disabled?: boolean | undefined;
};

/** Finds the next enabled item whose text begins with the search string. */
export function findTypeaheadMatch(
  items: readonly TypeaheadItem[],
  search: string,
  currentKey?: string,
) {
  const enabled = items.filter((item) => !item.disabled);
  if (!search || !enabled.length) return undefined;

  const startIndex = Math.max(0, enabled.findIndex((item) => item.key === currentKey) + 1);
  const ordered = [...enabled.slice(startIndex), ...enabled.slice(0, startIndex)];
  const normalizedSearch = search.toLocaleLowerCase();

  return ordered.find((item) => item.textValue.toLocaleLowerCase().startsWith(normalizedSearch))
    ?.key;
}

/**
 * Returns an accumulator for typeahead searches: each printable key extends
 * the search string until the timeout elapses, so typing "co" matches
 * "Copy" instead of jumping between "c" and "o" items.
 */
export function useTypeaheadSearch(timeout = 700) {
  const bufferRef = useRef("");
  const timeoutRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  return (key: string) => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      bufferRef.current = "";
    }, timeout);
    bufferRef.current += key;
    return bufferRef.current;
  };
}
