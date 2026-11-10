import { useId, useState, type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { useTabStop, useTabStopRootTabIndex } from "../internal/tab-stop.js";
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
  const tabStopKey = useTabStop(collection, focusedKey, selected);
  const rootTabIndex = useTabStopRootTabIndex(collection, tabStopKey);

  const Root = rootElement(as);
  return (
    <TabsContext
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        collection,
        tabStopKey,
        rootTabIndex,
        setFocusedKey,
      }}
    >
      <Root data-slot="tabs" {...props}>
        {children}
      </Root>
    </TabsContext>
  );
}
