import { useId, useRef, useState, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import {
  MenuRootContext,
  useOptionalMenuRootContext,
  type MenuInitialFocus,
} from "./menu-shared.js";
import { PopoverContext } from "../internal/overlay/index.js";

export type MenuProps = RootProps<{
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Menu({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  ...props
}: MenuProps) {
  const autocomplete = useAutocompleteContext();
  const generatedId = useId().replace(/:/g, "");
  const parentMenu = useOptionalMenuRootContext();
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

  const Root = rootElement(as);
  return (
    <MenuRootContext value={context}>
      <PopoverContext value={popoverContext}>
        <Root {...props} id={id} data-open={dataAttr(open)}>
          {children}
        </Root>
      </PopoverContext>
    </MenuRootContext>
  );
}
