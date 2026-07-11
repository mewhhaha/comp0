import { createElement, Fragment, useId, useMemo, useRef } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { MenuRootContext, type MenuProps } from "./menu-shared.js";

export type { MenuProps } from "./menu-shared.js";

export function Menu({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  ref,
  ...props
}: MenuProps & RefProp<HTMLElement>) {
  const generatedId = useId().replace(/:/g, "");
  const triggerElement = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const menuId = id ?? `menu-${generatedId}`;
  const context = useMemo(
    () => ({
      open,
      triggerId: `${menuId}-trigger`,
      contentId: `${menuId}-content`,
      setOpen,
      focusTrigger() {
        triggerElement.current?.focus();
      },
      setTriggerElement(element: HTMLElement | null) {
        triggerElement.current = element;
      },
    }),
    [menuId, open, setOpen],
  );
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(as, { ...props, ref, id, "data-open": dataAttr(open) }, children);
  }

  return <MenuRootContext.Provider value={context}>{root}</MenuRootContext.Provider>;
}
