import { useCallback, useRef } from "react";

/** The search fields needed to match a collection item by typed text. */
export interface TypeaheadItem {
  key: string;
  textValue: string;
  disabled?: boolean | undefined;
}

/** Finds the next enabled item whose text begins with the search string. */
export function findTypeaheadMatch(items: TypeaheadItem[], search: string, currentKey?: string) {
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

  return useCallback(
    (key: string) => {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        bufferRef.current = "";
      }, timeout);
      bufferRef.current += key;
      return bufferRef.current;
    },
    [timeout],
  );
}

/** Returns a keyboard handler that buffers printable characters for typeahead navigation. */
export function useTypeahead(options: {
  items: TypeaheadItem[];
  currentKey?: string | undefined;
  timeout?: number;
  onMatch: (key: string) => void;
}) {
  const bufferRef = useRef("");
  const timeoutRef = useRef<number | undefined>(undefined);

  return useCallback(
    (event: Pick<KeyboardEvent, "key" | "preventDefault">) => {
      if (event.key.length !== 1 || event.key.trim() === "") return;

      window.clearTimeout(timeoutRef.current);
      bufferRef.current += event.key;
      timeoutRef.current = window.setTimeout(() => {
        bufferRef.current = "";
      }, options.timeout ?? 700);

      const match = findTypeaheadMatch(options.items, bufferRef.current, options.currentKey);
      if (match) {
        event.preventDefault();
        options.onMatch(match);
      }
    },
    [options],
  );
}
