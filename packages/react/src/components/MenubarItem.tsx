import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { MenubarContext } from "./menubar-shared.js";
import { type MenubarItemProps } from "./menubar-shared.js";
export type { MenubarItemProps } from "./menubar-shared.js";

export function MenubarItem({
  id,
  disabled = false,
  textValue,
  children,
  onClick,
  onFocus,
  ref,
  ...props
}: MenubarItemProps & RefProp<HTMLButtonElement>) {
  const menubar = useContext(MenubarContext);
  const label =
    textValue ?? (typeof children === "string" ? children : (props["aria-label"] ?? id));
  const active =
    menubar?.activeKey === id || (!menubar?.activeKey && menubar?.items()[0]?.key === id);

  const itemRef = useCallback(
    (element: HTMLButtonElement | null) => {
      menubar?.registerItem({ key: id, textValue: label, element, disabled });
      composeRefs(ref)(element);
    },
    [disabled, id, label, menubar, ref],
  );

  return (
    <button
      {...props}
      ref={itemRef}
      id={id}
      type={props.type ?? "button"}
      role="menuitem"
      tabIndex={active ? 0 : -1}
      aria-disabled={disabled || undefined}
      data-disabled={dataAttr(disabled)}
      data-slot={dataSlot(props, "menubar-item")}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) menubar?.setActiveKey(id);
      }}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
