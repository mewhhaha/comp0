import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { type Collection, useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { TabsContext } from "./tabs-shared.js";

export type TabsProps = RootProps<{
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected tab value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Tabs({ as, children, value, defaultValue, onChange, ...props }: TabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const collection = useCollection();
  // The tab holding focus while focus is inside the list, so Shift+Tab leaves from it in one
  // press even when a controlled value rejected the arrow move that focused it.
  const [focusedKey, setFocusedKey] = useState("");
  // Registration, unregistration, and a tab's own disabled change all notify the collection,
  // so the stop follows them without Tabs re-rendering first.
  const tabStopKey = useSyncExternalStore(
    collection.subscribe,
    () => resolveTabStop(collection, focusedKey, selected),
    () => selected,
  );

  const Root = rootElement(as);
  return (
    <TabsContext
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        collection,
        tabStopKey,
        setFocusedKey,
      }}
    >
      <Root data-slot="tabs" {...props}>
        {children}
      </Root>
    </TabsContext>
  );
}

/**
 * The one tab in the sequence: the focused tab, else the selected tab, else the first enabled
 * tab. Before any tab registers it is the selected key, matching the server render.
 *
 * Runs on every Tabs render and every registry change, so the common case is two O(1) lookups;
 * only the fallback reads document order.
 */
function resolveTabStop(collection: Collection, focusedKey: string, selectedKey: string) {
  for (const key of [focusedKey, selectedKey]) {
    const tab = collection.get(key);
    if (tab && !tab.disabled) return key;
  }
  const items = collection.items();
  if (items.length === 0) return selectedKey;
  return items.find((tab) => !tab.disabled)?.key ?? "";
}
