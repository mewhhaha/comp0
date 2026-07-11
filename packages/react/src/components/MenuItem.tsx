import { useCallback, useContext, useId, useLayoutEffect, useRef } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import { MenuContext, resolveItemLabel } from "./collection-shared.js";
import { type MenuItemProps } from "./menu-shared.js";

export type { MenuItemProps } from "./menu-shared.js";

export function MenuItem({
  id: idProp,
  value: valueProp,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: MenuItemProps & RefProp<HTMLDivElement>) {
  const menu = useContext(MenuContext);
  const generatedId = useId().replace(/:/g, "");
  // The id prop is only ever the DOM id; the item key is value alone so the
  // two concepts cannot silently stand in for each other.
  const value = valueProp ?? generatedId;
  const id = idProp ?? `menu-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const ariaLabel = props["aria-label"];
  const elementRef = useRef<HTMLDivElement | null>(null);
  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element;
      menu?.register(
        value,
        resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
        element,
        resolvedDisabled,
      );
      composeRefs(ref)(element);
    },
    // children stays out: the layout effect below re-reads rendered text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ariaLabel, menu, ref, resolvedDisabled, textValue, value],
  );

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    menu?.register(
      value,
      resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
      element,
      resolvedDisabled,
    );
  });

  return (
    <InteractiveDiv
      {...props}
      ref={itemRef}
      id={id}
      role={props.role ?? "menuitem"}
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-disabled={resolvedDisabled || undefined}
      data-value={value}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) menu?.close?.();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          resolvedDisabled ||
          (event.key !== "Enter" && event.key !== " ")
        )
          return;
        event.preventDefault();
        event.currentTarget.click();
      }}
    >
      {children}
    </InteractiveDiv>
  );
}
