import { createElement, Fragment, useContext, useId, useRef } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { MenuRootContext, type MenuProps } from "./menu-shared.js";
import { PopoverContext } from "./overlay-shared.js";

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
  const autocomplete = useAutocompleteContext();
  const generatedId = useId().replace(/:/g, "");
  const parentMenu = useContext(MenuRootContext);
  const triggerElement = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const menuId = id ?? `menu-${generatedId}`;
  const context = {
    open,
    isSubmenu: parentMenu !== null,
    triggerId: `${menuId}-trigger`,
    contentId:
      autocomplete?.collectionId ?? autocomplete?.defaultCollectionId ?? `${menuId}-content`,
    setOpen,
    closeAll() {
      if (autocomplete && !autocomplete.disableVirtualFocus) autocomplete.clearActive();
      setOpen(false);
      if (parentMenu) parentMenu.closeAll();
      else if (autocomplete && !autocomplete.disableVirtualFocus) {
        autocomplete.inputRef.current?.focus();
      } else {
        triggerElement.current?.focus();
      }
    },
    focusTrigger() {
      if (autocomplete && !autocomplete.disableVirtualFocus) {
        autocomplete.clearActive();
        autocomplete.inputRef.current?.focus();
      } else {
        triggerElement.current?.focus();
      }
    },
    setTriggerElement(element: HTMLElement | null) {
      triggerElement.current = element;
    },
  };
  // The menu composes with the popover system internally: providing
  // PopoverContext lets MenuPopover share the top-layer surface machinery
  // with SelectPopover instead of rendering in normal flow.
  const popoverContext = {
    ...context,
    requestClose() {
      context.setOpen(false);
      context.focusTrigger();
    },
  };
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(as, { ...props, ref, id, "data-open": dataAttr(open) }, children);
  }

  return (
    <MenuRootContext value={context}>
      <PopoverContext value={popoverContext}>{root}</PopoverContext>
    </MenuRootContext>
  );
}
