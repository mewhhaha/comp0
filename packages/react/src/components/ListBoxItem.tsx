import { useCallback, useContext, useId } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ListBoxContext } from "./collection-shared.js";
import { type ListBoxItemProps } from "./collection-shared.js";
export type { ListBoxItemProps } from "./collection-shared.js";
export function ListBoxItem({
  id: idProp,
  value: valueProp,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ListBoxItemProps & RefProp<HTMLDivElement>) {
  const listBox = useContext(ListBoxContext);
  const generatedId = useId().replace(/:/g, "");
  const value = valueProp ?? idProp ?? generatedId;
  const id = idProp ?? `listbox-option-${generatedId}`;
  const registerListBoxItem = listBox?.register;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox?.selectedKey === value;
  const active = !listBox?.selectedKey && listBox?.activeKey === value;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  const label = typeof children === "string" ? children : (props["aria-label"] ?? value);

  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerListBoxItem?.(value, label, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [label, ref, registerListBoxItem, resolvedDisabled, value],
  );

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
      data-value={value}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) {
          listBox?.setActiveKey(value);
          listBox?.setSelectedKey(value);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        listBox?.setActiveKey(value);
        listBox?.setSelectedKey(value);
      }}
    >
      {children}
    </div>
  );
}
