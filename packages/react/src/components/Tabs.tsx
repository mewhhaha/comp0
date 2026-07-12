import { dataSlot, type RefProp } from "../shared.js";
import { useId, useRef } from "react";
import { useControllableState } from "@comp0/core";
import { TabsContext } from "./disclosure-shared.js";
import { type TabsProps } from "./disclosure-shared.js";
import { ProviderRoot } from "./provider-root.js";
export type { TabsProps } from "./disclosure-shared.js";
export function Tabs({
  as,
  children,
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: TabsProps & RefProp<HTMLElement>) {
  const baseId = useId();
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const tabMap = useRef(
    new Map<
      string,
      { key: string; disabled?: boolean | undefined; element: HTMLButtonElement | null }
    >(),
  );

  return (
    <TabsContext.Provider
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        registerTab(key, element, disabled) {
          if (!element) {
            tabMap.current.delete(key);
            return;
          }
          tabMap.current.set(key, { key, element, disabled });
        },
        tabs() {
          return [...tabMap.current.values()].sort((a, b) => {
            if (!a.element || !b.element) return 0;
            if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
              return 1;
            }
            return -1;
          });
        },
      }}
    >
      <ProviderRoot as={as} {...props} ref={ref} data-slot={dataSlot(props, "tabs")}>
        {children}
      </ProviderRoot>
    </TabsContext.Provider>
  );
}
