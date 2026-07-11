import { useContext, useEffect, useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { SelectCollectionContext } from "./pickers-shared.js";
import { usePopoverContext } from "./overlay-shared.js";

export type SelectOptionProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value: string;
  id?: string;
  disabled?: boolean;
};

export function SelectOption({
  value,
  id: idProp,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: SelectOptionProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const popover = usePopoverContext();
  if (!select || !popover)
    throw new Error("SelectOption must be rendered inside Select and Popover.");
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `${select?.listBoxId ?? "select"}-option-${generatedId}`;
  const label = typeof children === "string" ? children : (props["aria-label"] ?? value);
  const resolvedDisabled = Boolean(disabled || select.disabled);
  useEffect(() => {
    select.registerItem(value, label);
    return () => select.unregisterItem(value);
  }, [label, select, value]);
  const collection = useContext(SelectCollectionContext);
  const element = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    collection?.register({
      value,
      id,
      text: label,
      disabled: resolvedDisabled,
      element: element.current,
    });
    return () => collection?.unregister(value);
  }, [collection, id, label, resolvedDisabled, value]);
  const selected = select?.selectedKey === value;
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
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-selected={dataAttr(selected)}
      data-value={value}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          select.setSelectedKey(value);
          popover.requestClose();
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select.setSelectedKey(value);
        popover.requestClose();
      }}
    >
      {children}
    </div>
  );
}
