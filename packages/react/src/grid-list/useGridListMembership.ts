import { useLayoutEffect, useRef } from "react";
import { useComposedRefs } from "@comp0/core";
import { type GridListReorderGroupContextValue } from "./grid-list-shared.js";

type RegisteredList = {
  group: GridListReorderGroupContextValue;
  name: string;
  element: HTMLElement;
};

/**
 * Registers a GridList's element with its GridListReorderGroup under `name`,
 * following renames and group changes. Returns the ref callback to put on the
 * list element.
 */
export function useGridListMembership(
  name: string | undefined,
  group: GridListReorderGroupContextValue | null,
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const registered = useRef<RegisteredList | null>(null);

  const listRef = (element: HTMLElement | null) => {
    if (!element) {
      const current = registered.current;
      if (current) current.group.unregisterList(current.name, current.element);
      registered.current = null;
      return;
    }
    if (!group || !name) return;
    group.registerList(name, element);
    registered.current = { group, name, element };
  };

  useLayoutEffect(() => {
    const element = elementRef.current;
    const current = registered.current;
    if (!group || !name || !element) {
      if (current) current.group.unregisterList(current.name, current.element);
      registered.current = null;
      return;
    }
    if (current && current.name !== name) {
      current.group.unregisterList(current.name, current.element);
      registered.current = null;
    }
    if (!registered.current) {
      group.registerList(name, element);
      registered.current = { group, name, element };
    }
  });

  return useComposedRefs(listRef, elementRef);
}
