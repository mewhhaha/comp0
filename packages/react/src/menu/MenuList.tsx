import { useLayoutEffect, type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs, useCollection, useCollectionNavigation } from "@comp0/core";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  MenuListContext,
  useMenuRootContext,
  useOptionalContextMenuContext,
} from "./menu-shared.js";
import { useOptionalMenubarContext } from "../menubar/menubar-shared.js";
import { writingDirection } from "../internal/writing-direction.js";

export type MenuListProps = Omit<ComponentProps<"div">, "role"> & AsProp;

export function MenuList({ as, children, onKeyDown, ref, ...props }: MenuListProps) {
  const autocomplete = useAutocompleteContext();
  const menu = useMenuRootContext("MenuList");
  const autocompleteInputRef = autocomplete?.inputRef;
  const virtualFocusEnabled = autocomplete !== null && !autocomplete.disableVirtualFocus;
  const collectionId = props.id ?? autocomplete?.defaultCollectionId ?? menu.contentId;
  const setAutocompleteCollectionId = autocomplete?.setCollectionId;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;
  const setMenuListId = menu.setListId;
  const menubar = useOptionalMenubarContext();
  const inMenubar = menubar !== null && !menu.isSubmenu;
  const contextMenu = useOptionalContextMenuContext();
  const ownContextMenu = contextMenu !== null && contextMenu.contentId === menu.contentId;
  const navigate = useCollectionNavigation();
  const collection = useCollection();
  const context = { collection, close: menu.closeAll };

  useLayoutEffect(() => {
    menu.setInitialFocus((position) => {
      if (virtualFocusEnabled) {
        autocompleteInputRef?.current?.focus();
        return;
      }
      const enabledItems = collection.enabledItems();
      const target = position === "last" ? enabledItems.at(-1) : enabledItems[0];
      target?.element?.focus();
    });
    return () => menu.setInitialFocus(null);
  });

  useLayoutEffect(() => {
    if (!collectionId) return;
    setMenuListId(collectionId);
    return () => setMenuListId(undefined);
  }, [collectionId, setMenuListId]);

  useLayoutEffect(() => {
    if (!collectionId || !setAutocompleteCollectionId || !setAutocompleteCollectionVersion) return;
    setAutocompleteCollectionId(collectionId);
    setAutocompleteCollectionVersion((version) => version + 1);
    return () => {
      setAutocompleteCollectionId((currentId) =>
        currentId === collectionId ? undefined : currentId,
      );
      setAutocompleteCollectionVersion((version) => version + 1);
    };
  }, [collectionId, setAutocompleteCollectionId, setAutocompleteCollectionVersion]);

  useLayoutEffect(() => {
    if (!setAutocompleteCollectionVersion) return;
    setAutocompleteCollectionVersion((version) => version + 1);
  }, [menu.open, setAutocompleteCollectionVersion]);

  let labelledBy = props["aria-labelledby"];
  if (!ownContextMenu && !props["aria-label"] && labelledBy === undefined) {
    labelledBy = menu.triggerId;
  }

  const Part = partElement(as, "div");
  return (
    <MenuListContext value={context}>
      <Part
        {...props}
        ref={composeRefs(ref, autocomplete?.collectionRef)}
        id={collectionId}
        role="menu"
        aria-labelledby={labelledBy}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          let targetMenu: Element | null = null;
          if (ownerWindow && event.target instanceof ownerWindow.Element) {
            targetMenu = event.target.closest("[role='menu']");
          }
          if (targetMenu !== event.currentTarget) return;
          const closeSubmenuKey =
            writingDirection(event.currentTarget) === "rtl" ? "ArrowRight" : "ArrowLeft";
          if (menu.isSubmenu && event.key === closeSubmenuKey) {
            event.preventDefault();
            menu.setOpen(false);
            menu.focusTrigger();
            return;
          }
          if (inMenubar && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
            const moved = menubar.moveFocus(menu.triggerId, event.key, { open: true });
            if (moved) {
              event.preventDefault();
              return;
            }
          }
          const items = collection.items();
          const activeElement = event.currentTarget.ownerDocument.activeElement;
          const current = items.find((item) => item.element === activeElement)?.key;
          const key = navigate(event.key, items, current, { orientation: "vertical", loop: true });
          if (!key) return;
          event.preventDefault();
          collection.get(key)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </MenuListContext>
  );
}
