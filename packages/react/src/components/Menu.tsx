import { useRef } from "react";
import { findTypeaheadMatch, getRovingFocusTarget } from "@comp0/core";
import {
  InteractiveDiv,
  useAutocompleteContext,
  useComboBoxRootContext,
  type RefProp,
} from "../shared.js";
import { MenuContext, sortItems } from "./collection-shared.js";
import {
  type SelectableCollectionContextValue,
  type CollectionItemRecord,
  type MenuProps,
} from "./collection-shared.js";
export type { MenuProps } from "./collection-shared.js";
export function Menu({ onKeyDown, ref, ...props }: MenuProps & RefProp<HTMLDivElement>) {
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const selectedRef = useRef("");
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const context: SelectableCollectionContextValue = {
    activeKey: selectedRef.current,
    selectedKey: selectedRef.current,
    setActiveKey(key) {
      selectedRef.current = key;
    },
    setSelectedKey(key) {
      selectedRef.current = key;
    },
    register(key, textValue, element, disabled) {
      if (element) itemMap.current.set(key, { key, textValue, element, disabled });
      else itemMap.current.delete(key);
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };

  return (
    <MenuContext.Provider value={context}>
      <InteractiveDiv
        {...props}
        ref={ref}
        id={props.id ?? comboBox?.listBoxId}
        role={props.role ?? (autocomplete ? "listbox" : "menu")}
        aria-labelledby={props["aria-labelledby"] ?? comboBox?.labelId}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const items = context.items();
          const current =
            document.activeElement instanceof HTMLElement ? document.activeElement.id : undefined;
          const key =
            getRovingFocusTarget(items, current, event.key, {
              orientation: "vertical",
              loop: true,
            }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, current) : undefined);
          if (!key) return;
          event.preventDefault();
          context.setActiveKey(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      />
    </MenuContext.Provider>
  );
}
