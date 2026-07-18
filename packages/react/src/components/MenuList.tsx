import { useLayoutEffect, useRef } from "react";
import {
  composeRefs,
  findTypeaheadMatch,
  getRovingFocusTarget,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import {
  MenuContext,
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { useContextMenuContext, useMenuRootContext, type MenuListProps } from "./menu-shared.js";
import { useMenubarContext } from "./menubar-shared.js";

export type { MenuListProps } from "./menu-shared.js";

export function MenuList({
  children,
  onKeyDown,
  ref,
  ...props
}: MenuListProps & RefProp<HTMLDivElement>) {
  const autocomplete = useAutocompleteContext();
  const menu = useMenuRootContext();
  const autocompleteInputRef = autocomplete?.inputRef;
  const virtualFocusEnabled = autocomplete !== null && !autocomplete.disableVirtualFocus;
  const collectionId = props.id ?? autocomplete?.defaultCollectionId ?? menu?.contentId;
  const setAutocompleteCollectionId = autocomplete?.setCollectionId;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;
  const setMenuListId = menu?.setListId;
  const menubar = useMenubarContext();
  const inMenubar = menubar !== null && menu !== null && !menu.isSubmenu;
  const contextMenu = useContextMenuContext();
  const ownContextMenu = contextMenu !== null && contextMenu.contentId === menu?.contentId;
  const typeaheadSearch = useTypeaheadSearch();
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const activeKey = useRef("");
  const context: SelectableCollectionContextValue = {
    activeKey: activeKey.current,
    selectedKey: "",
    setActiveKey(key) {
      activeKey.current = key;
    },
    setSelectedKey() {},
    close() {
      menu?.closeAll();
    },
    register(key, textValue, element, disabled) {
      if (element) itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
      else itemMap.current.delete(key);
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };
  const focusItem = (key: string) => {
    const item = context.items().find((candidate) => candidate.key === key);
    if (!item) return;
    context.setActiveKey(key);
    item.element?.focus();
  };

  useLayoutEffect(() => {
    if (!menu) return;
    menu.setInitialFocus((position) => {
      if (virtualFocusEnabled) {
        autocompleteInputRef?.current?.focus();
        return;
      }
      const enabledItems = sortItems([...itemMap.current.values()]).filter(
        (item) => !item.disabled,
      );
      const target = position === "last" ? enabledItems.at(-1) : enabledItems[0];
      if (target) {
        activeKey.current = target.key;
        target.element?.focus();
      }
    });
    return () => menu.setInitialFocus(null);
  });

  useLayoutEffect(() => {
    if (!collectionId || !setMenuListId) return;
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
  }, [menu?.open, setAutocompleteCollectionVersion]);

  let labelledBy = props["aria-labelledby"];
  if (!ownContextMenu && !props["aria-label"] && labelledBy === undefined) {
    labelledBy = menu?.triggerId;
  }

  return (
    <MenuContext value={context}>
      <div
        {...props}
        ref={composeRefs(ref, autocomplete?.collectionRef)}
        id={collectionId}
        role="menu"
        aria-labelledby={labelledBy}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const ownerWindow = event.currentTarget.ownerDocument.defaultView;
          const targetMenu =
            ownerWindow && event.target instanceof ownerWindow.Element
              ? event.target.closest("[role='menu']")
              : null;
          if (targetMenu !== event.currentTarget) return;
          if (menu?.isSubmenu && event.key === "ArrowLeft") {
            event.preventDefault();
            menu.setOpen(false);
            menu.focusTrigger();
            return;
          }
          if (inMenubar && menu && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
            const moved = menubar.moveFocus(menu.triggerId, event.key, { open: true });
            if (moved) {
              event.preventDefault();
              return;
            }
          }
          const items = context.items();
          const activeElement = event.currentTarget.ownerDocument.activeElement;
          const current = items.find((item) => item.element === activeElement)?.key;
          let key = getRovingFocusTarget(items, current, event.key, {
            orientation: "vertical",
            loop: true,
          });
          if (!key && event.key.length === 1) {
            key = findTypeaheadMatch(items, typeaheadSearch(event.key), current);
          }
          if (!key) return;
          event.preventDefault();
          focusItem(key);
        }}
      >
        {children}
      </div>
    </MenuContext>
  );
}
