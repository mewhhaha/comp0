import { useCallback, useContext, useEffect } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import {
  useAutocompleteContext,
  useComboBoxRootContext,
  useSelectRootContext,
  type RefProp,
} from "../shared.js";
import { ListBoxContext } from "./collection-shared.js";
import { type ListBoxItemProps } from "./collection-shared.js";
export type { ListBoxItemProps } from "./collection-shared.js";
export function ListBoxItem({
  id,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ListBoxItemProps & RefProp<HTMLDivElement>) {
  const listBox = useContext(ListBoxContext);
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const autocomplete = useAutocompleteContext();
  const picker = select ?? comboBox;
  const registerListBoxItem = listBox?.register;
  const registerPickerItem = picker?.registerItem;
  const unregisterPickerItem = picker?.unregisterItem;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox?.selectedKey === id;
  const active = !listBox?.selectedKey && listBox?.activeKey === id;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  const label = typeof children === "string" ? children : (props["aria-label"] ?? id);
  const visible = autocomplete?.isItemVisible(label) ?? true;

  useEffect(() => {
    if (!visible) return undefined;
    registerPickerItem?.(id, label);
    return () => unregisterPickerItem?.(id);
  }, [id, label, registerPickerItem, unregisterPickerItem, visible]);

  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerListBoxItem?.(id, label, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [id, label, ref, registerListBoxItem, resolvedDisabled],
  );

  if (!visible) return null;

  return (
    <div
      {...props}
      ref={itemRef}
      id={id}
      role="option"
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={id}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          listBox?.setActiveKey(id);
          comboBox?.setActiveKey(id);
          listBox?.setSelectedKey(id);
          autocomplete?.selectItem(id, label);
          picker?.setOpen(false);
          document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        listBox?.setActiveKey(id);
        comboBox?.setActiveKey(id);
        listBox?.setSelectedKey(id);
        autocomplete?.selectItem(id, label);
        picker?.setOpen(false);
        document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
      }}
    >
      {children}
    </div>
  );
}
