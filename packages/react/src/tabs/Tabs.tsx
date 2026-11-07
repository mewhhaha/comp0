import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
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
  const tabStopKey = useRef("");
  // Read by syncTabStops, which a Tab's unmount cleanup calls with the closure it mounted with.
  const selectedRef = useRef(selected);

  // The one tab in the sequence: the focused tab, else the selected tab, else the last stop,
  // else the first enabled tab. A focused stop lets Shift+Tab leave the list in one press.
  const syncTabStops = () => {
    const focused = collection.items().find((tab) => tab.element?.matches(":focus"));
    const candidates = [
      focused,
      collection.get(selectedRef.current),
      collection.get(tabStopKey.current),
    ];
    const active = candidates.find((tab) => tab && !tab.disabled) ?? collection.enabledItems()[0];
    tabStopKey.current = active?.key ?? "";
    for (const tab of collection.items()) {
      if (tab.element) tab.element.tabIndex = tab.key === active?.key ? 0 : -1;
    }
  };

  // Keep exactly one tab stop as tabs mount or change state.
  useLayoutEffect(() => {
    selectedRef.current = selected;
    syncTabStops();
  });

  const Root = rootElement(as);
  return (
    <TabsContext
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        collection,
        syncTabStops,
      }}
    >
      <Root data-slot="tabs" {...props}>
        {children}
      </Root>
    </TabsContext>
  );
}
