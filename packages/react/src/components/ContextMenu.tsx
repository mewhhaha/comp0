import {
  createElement,
  Fragment,
  useId,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  ContextMenuContext,
  MenuRootContext,
  type ContextMenuContextValue,
  type MenuRootContextValue,
} from "./menu-shared.js";
import { PopoverContext } from "./overlay-shared.js";

export type ContextMenuProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
};

/**
 * A menu opened from a right click (or Shift+F10 / the ContextMenu key)
 * instead of a trigger button. Wrap the right-clickable area in
 * ContextMenuTrigger and put a MenuList inside MenuPopover; the recorded
 * pointer position is exposed on the popover element as the CSS variables
 * --comp0-context-menu-x and --comp0-context-menu-y (px values), so anchor
 * it yourself with `position: fixed; left: var(--comp0-context-menu-x);
 * top: var(--comp0-context-menu-y)`. Give the popover an aria-label; no
 * button labels it. Escape closes and restores focus to where it was.
 */
export function ContextMenu({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  ref,
  ...props
}: ContextMenuProps & RefProp<HTMLElement>) {
  const generatedId = useId().replace(/:/g, "");
  const areaElement = useRef<HTMLElement | null>(null);
  const restoreElement = useRef<HTMLElement | null>(null);
  const initialFocus = useRef<() => void>(() => undefined);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuId = id ?? `context-menu-${generatedId}`;
  const [listId, setListId] = useState<string>();
  const restoreFocus = () => {
    const target = restoreElement.current ?? areaElement.current;
    target?.focus();
  };
  const context: MenuRootContextValue = {
    open,
    isSubmenu: false,
    triggerId: `${menuId}-trigger`,
    contentId: listId ?? `${menuId}-content`,
    setOpen,
    setListId,
    closeAll() {
      setOpen(false);
      restoreFocus();
    },
    focusTrigger() {
      restoreFocus();
    },
    focusInitial() {
      initialFocus.current();
    },
    setInitialFocus(focus) {
      initialFocus.current = focus ?? (() => undefined);
    },
    setTriggerElement(element) {
      areaElement.current = element;
    },
    setSurfaceElement() {},
  };
  const contextMenu: ContextMenuContextValue = {
    contentId: context.contentId,
    position,
    openAt(x, y) {
      if (!open) {
        let restore: HTMLElement | null = null;
        const activeElement = areaElement.current?.ownerDocument.activeElement;
        const ownerWindow = areaElement.current?.ownerDocument.defaultView;
        if (ownerWindow && activeElement instanceof ownerWindow.HTMLElement) {
          restore = activeElement;
        }
        restoreElement.current = restore;
      }
      setPosition({ x, y });
      setOpen(true);
    },
  };
  // Sharing PopoverContext lets MenuPopover reuse the top-layer popover
  // surface machinery, exactly as it does under a regular Menu.
  const popoverContext = {
    ...context,
    requestClose() {
      setOpen(false);
      restoreFocus();
    },
  };
  let root = children;
  if (as && as !== Fragment) {
    root = createElement(as, { ...props, ref, id, "data-open": dataAttr(open) }, children);
  }

  return (
    <MenuRootContext value={context}>
      <ContextMenuContext value={contextMenu}>
        <PopoverContext value={popoverContext}>{root}</PopoverContext>
      </ContextMenuContext>
    </MenuRootContext>
  );
}
