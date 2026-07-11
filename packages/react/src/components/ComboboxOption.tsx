import { useContext, useEffect, useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { ComboboxCollectionContext } from "./pickers-shared.js";
import { usePopoverContext } from "./overlay-shared.js";
export type ComboboxOptionProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value: string;
  id?: string;
  disabled?: boolean;
};
export function ComboboxOption({
  value,
  id: idProp,
  disabled,
  children,
  onClick,
  ref,
  ...props
}: ComboboxOptionProps & RefProp<HTMLDivElement>) {
  const combo = useComboBoxRootContext();
  const popover = usePopoverContext();
  if (!combo || !popover)
    throw new Error("ComboboxOption must be rendered inside Combobox and Popover.");
  const {
    activeId,
    activeKey,
    isItemVisible,
    registerItem,
    setActiveId,
    setActiveKey,
    setSelectedKey,
    unregisterItem,
  } = combo;
  const collection = useContext(ComboboxCollectionContext);
  const element = useRef<HTMLDivElement>(null);
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `${combo?.listBoxId ?? "combobox"}-option-${generatedId}`;
  const label = typeof children === "string" ? children : (props["aria-label"] ?? value);
  const resolvedDisabled = Boolean(disabled || combo.disabled);
  const visible = isItemVisible(label);
  useEffect(() => {
    if (!visible) return;
    registerItem(value, label);
    collection?.register({
      value,
      id,
      text: label,
      disabled: resolvedDisabled,
      element: element.current,
    });
    return () => {
      unregisterItem(value);
      collection?.unregister(value);
    };
  }, [collection, id, label, registerItem, resolvedDisabled, unregisterItem, value, visible]);
  useLayoutEffect(() => {
    if (!visible && (activeId === id || activeKey === value)) {
      setActiveId("");
      setActiveKey("");
    }
  }, [activeId, activeKey, id, setActiveId, setActiveKey, value, visible]);
  if (!visible) return null;
  const selected = combo?.selectedKey === value;
  const active = activeId === id || activeKey === value;
  return (
    <div
      {...props}
      ref={(node) => {
        element.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-active={dataAttr(active)}
      data-selected={dataAttr(selected)}
      data-value={value}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          setSelectedKey(value);
          popover.requestClose();
        }
      }}
    >
      {children}
    </div>
  );
}
