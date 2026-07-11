import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { dataAttr } from "@comp0/core";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { ComboboxCollectionContext } from "./pickers-shared.js";
import { usePopoverContext } from "./overlay-shared.js";
export type ComboboxOptionProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value: string;
  id?: string;
  disabled?: boolean;
  /** Overrides the text crawled from children for filtering and typeahead. */
  textValue?: string;
};
export function ComboboxOption({
  value,
  id: idProp,
  disabled,
  textValue,
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
  // Filtering happens during render, before the element exists, so crawled
  // text is cached in state and survives the option being filtered out.
  const [crawled, setCrawled] = useState("");
  let label = textValue;
  if (label === undefined && typeof children === "string") label = children;
  if (label === undefined && crawled) label = crawled;
  if (label === undefined) label = props["aria-label"] ?? value;
  const resolvedDisabled = Boolean(disabled || combo.disabled);
  const visible = isItemVisible(label);
  useLayoutEffect(() => {
    const text = element.current?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text && text !== crawled) setCrawled(text);
  });
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
