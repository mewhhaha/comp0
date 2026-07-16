import { createElement, Fragment, useContext, useId, useRef, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import { MenuRootContext, type MenuInitialFocus, type MenuProps } from "./menu-shared.js";
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
  const surfaceElement = useRef<HTMLDivElement | null>(null);
  const initialFocus = useRef<(position: MenuInitialFocus) => void>(() => undefined);
  const pendingInitialFocus = useRef<MenuInitialFocus>("first");
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const menuId = id ?? `menu-${generatedId}`;
  const [listId, setListId] = useState<string>();
  const focusAfterClose = () => {
    const input = autocomplete?.inputRef.current;
    if (
      autocomplete &&
      !autocomplete.disableVirtualFocus &&
      input &&
      !surfaceElement.current?.contains(input)
    ) {
      input.focus();
      return;
    }
    triggerElement.current?.focus();
  };
  const context = {
    open,
    isSubmenu: parentMenu !== null,
    triggerId: `${menuId}-trigger`,
    contentId: listId ?? autocomplete?.defaultCollectionId ?? `${menuId}-content`,
    setOpen,
    setListId,
    closeAll() {
      if (autocomplete && !autocomplete.disableVirtualFocus) autocomplete.clearActive();
      setOpen(false);
      if (parentMenu) parentMenu.closeAll();
      else focusAfterClose();
    },
    focusTrigger() {
      if (
        autocomplete &&
        !autocomplete.disableVirtualFocus &&
        !surfaceElement.current?.contains(autocomplete.inputRef.current)
      ) {
        autocomplete.clearActive();
        autocomplete.inputRef.current?.focus();
      } else {
        triggerElement.current?.focus();
      }
    },
    focusInitial() {
      const position = pendingInitialFocus.current;
      pendingInitialFocus.current = "first";
      initialFocus.current(position);
    },
    requestInitialFocus(position: MenuInitialFocus) {
      pendingInitialFocus.current = position;
    },
    setInitialFocus(focus: ((position: MenuInitialFocus) => void) | null) {
      initialFocus.current = focus ?? (() => undefined);
    },
    setTriggerElement(element: HTMLElement | null) {
      triggerElement.current = element;
    },
    setSurfaceElement(element: HTMLDivElement | null) {
      surfaceElement.current = element;
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
