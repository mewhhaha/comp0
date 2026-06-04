import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { MenubarContext, MenubarMenuContext } from "./menubar-shared.js";
import { type MenubarTriggerProps } from "./menubar-shared.js";
export type { MenubarTriggerProps } from "./menubar-shared.js";

export function MenubarTrigger({
  disabled = false,
  textValue,
  children,
  onClick,
  onFocus,
  ref,
  ...props
}: MenubarTriggerProps & RefProp<HTMLButtonElement>) {
  const menubar = useContext(MenubarContext);
  const menu = useContext(MenubarMenuContext);
  const key = menu?.id ?? props.id ?? "";
  const open = menubar?.openKey === key;
  const label =
    textValue ?? (typeof children === "string" ? children : (props["aria-label"] ?? key));
  const active =
    menubar?.activeKey === key || (!menubar?.activeKey && menubar?.items()[0]?.key === key);

  const triggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (key) menubar?.registerItem({ key, textValue: label, element, disabled, hasPopup: true });
      composeRefs(ref)(element);
    },
    [disabled, key, label, menubar, ref],
  );

  return (
    <button
      {...props}
      ref={triggerRef}
      id={props.id ?? menu?.triggerId}
      type={props.type ?? "button"}
      role="menuitem"
      tabIndex={active ? 0 : -1}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menu?.contentId}
      aria-disabled={disabled || undefined}
      data-open={dataAttr(open)}
      data-disabled={dataAttr(disabled)}
      data-slot={dataSlot(props, "menubar-trigger")}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented && key) menubar?.setActiveKey(key);
      }}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented && key) menubar?.setOpenKey(open ? "" : key);
      }}
    >
      {children}
    </button>
  );
}
