import { useCallback, useContext, useId, useLayoutEffect, useRef } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ListBoxContext, resolveItemLabel } from "./collection-shared.js";
import { type ListBoxItemProps } from "./collection-shared.js";
export type { ListBoxItemProps } from "./collection-shared.js";
export function ListBoxItem({
  id: idProp,
  value: valueProp,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: ListBoxItemProps & RefProp<HTMLDivElement>) {
  const listBox = useContext(ListBoxContext);
  const generatedId = useId().replace(/:/g, "");
  // The id prop is only ever the DOM id; the selection key is value alone so
  // the two concepts cannot silently stand in for each other.
  const value = valueProp ?? generatedId;
  const id = idProp ?? `listbox-option-${generatedId}`;
  const registerListBoxItem = listBox?.register;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox?.selectedKey === value;
  const active = !listBox?.selectedKey && listBox?.activeKey === value;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  const ariaLabel = props["aria-label"];
  const elementRef = useRef<HTMLDivElement | null>(null);

  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element;
      registerListBoxItem?.(
        value,
        resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
        element,
        resolvedDisabled,
      );
      composeRefs(ref)(element);
    },
    // children stays out: the layout effect below re-reads rendered text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ariaLabel, ref, registerListBoxItem, resolvedDisabled, textValue, value],
  );

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    registerListBoxItem?.(
      value,
      resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
      element,
      resolvedDisabled,
    );
  });

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
