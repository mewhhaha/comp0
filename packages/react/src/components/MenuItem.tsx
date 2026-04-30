import { useContext, useEffect } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import {
  InteractiveDiv,
  useAutocompleteContext,
  useComboBoxRootContext,
  type RefProp,
} from "../shared.js";
import { MenuContext } from "./collection-shared.js";
import { type MenuItemProps } from "./collection-shared.js";
export type { MenuItemProps } from "./collection-shared.js";
export function MenuItem({
  id,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: MenuItemProps & RefProp<HTMLDivElement>) {
  const menu = useContext(MenuContext);
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const registerPickerItem = comboBox?.registerItem;
  const unregisterPickerItem = comboBox?.unregisterItem;
  const resolvedDisabled = Boolean(disabled);
  const label = typeof children === "string" ? children : (props["aria-label"] ?? id);
  const visible = autocomplete?.isItemVisible(label) ?? true;

  useEffect(() => {
    if (!visible) return undefined;
    registerPickerItem?.(id, label);
    return () => unregisterPickerItem?.(id);
  }, [id, label, registerPickerItem, unregisterPickerItem, visible]);

  if (!visible) return null;

  return (
    <InteractiveDiv
      {...props}
      ref={(element) => {
        menu?.register(id, label, element, resolvedDisabled);
        composeRefs(ref)(element);
      }}
      id={id}
      role={props.role ?? (autocomplete ? "option" : "menuitem")}
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-selected={autocomplete ? comboBox?.selectedKey === id : undefined}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-selected={dataAttr(autocomplete ? comboBox?.selectedKey === id : undefined)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) event.preventDefault();
        if (!event.defaultPrevented && autocomplete) {
          comboBox?.setActiveKey(id);
          comboBox?.setSelectedKey(id);
          autocomplete.selectItem(id, label);
          comboBox?.setOpen(false);
          document.getElementById(comboBox?.inputId ?? "")?.focus();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!resolvedDisabled) event.currentTarget.click();
      }}
    >
      {children}
    </InteractiveDiv>
  );
}
