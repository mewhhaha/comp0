import { dataSlot, type RefProp } from "../shared.js";
import { useCallback, useId, useRef } from "react";
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
  // Tab ref callbacks depend on this identity; keep registration stable so
  // ordinary parent renders do not unregister every tab during commit.
  const registerTab = useCallback(
    (key: string, element: HTMLButtonElement | null, disabled?: boolean) => {
      if (!element) {
        tabMap.current.delete(key);
        return;
      }
      const current = tabMap.current.get(key);
      if (current?.element === element && current.disabled === disabled) return;
      tabMap.current.set(key, { key, element, disabled });
    },
    [],
  );

  return (
    <TabsContext
      value={{
        baseId,
        selectedKey: selected,
        setSelectedKey: setSelected,
        registerTab,
        hasEnabledTab(key) {
          const tab = tabMap.current.get(key);
          return Boolean(tab?.element && !tab.disabled);
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
    </TabsContext>
  );
}
