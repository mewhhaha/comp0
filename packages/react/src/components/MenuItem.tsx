import { useCallback, useContext, useId } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import { MenuContext } from "./collection-shared.js";
import { type MenuItemProps } from "./menu-shared.js";

export type { MenuItemProps } from "./menu-shared.js";

export function MenuItem({
  id: idProp,
  value: valueProp,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: MenuItemProps & RefProp<HTMLDivElement>) {
  const menu = useContext(MenuContext);
  const generatedId = useId().replace(/:/g, "");
  const value = valueProp ?? idProp ?? generatedId;
  const id = idProp ?? `menu-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const label = typeof children === "string" ? children : (props["aria-label"] ?? value);
  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      menu?.register(value, label, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [label, menu, ref, resolvedDisabled, value],
  );

  return (
    <InteractiveDiv
      {...props}
      ref={itemRef}
      id={id}
      role={props.role ?? "menuitem"}
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-disabled={resolvedDisabled || undefined}
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
