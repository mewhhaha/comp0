import { useId, type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { useCollectionSeed } from "../internal/collection-pass.js";
import { useTabStopSelection, useTabStopStore } from "../internal/tab-stop.js";
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
  // On the server and while hydrating, TabList collects the tabs before they render, so the
  // stop is already resolved in server HTML.
  const seed = useCollectionSeed();
  // The stop is the tab holding focus while focus is inside the list, so Shift+Tab leaves from
  // it in one press even when a controlled value rejected the arrow move that focused it, and
  // the selected tab otherwise. Registration, unregistration, and a tab's own disabled change
  // all notify the store, and each tab reads its own boolean, so a move re-renders two tabs.
  const selection = useTabStopSelection(selected);
  const tabStops = useTabStopStore(collection, seed);
  const setFocusedKey = (key: string) => {
    tabStops.focus(key, selection);
  };

  const Root = rootElement(as);
  return (
    <TabsContext
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        collection,
        seed,
        tabStops,
        selection,
        setFocusedKey,
      }}
    >
      <Root data-slot="tabs" {...props}>
        {children}
      </Root>
    </TabsContext>
  );
}
