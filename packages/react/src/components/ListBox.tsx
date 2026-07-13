import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  composeRefs,
  findTypeaheadMatch,
  getRovingFocusTarget,
  useControllableState,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ListBoxContext, sortItems } from "./collection-shared.js";
import { useAutocompleteContext } from "./autocomplete-shared.js";
import {
  type SelectableCollectionContextValue,
  type CollectionItemRecord,
  type ListBoxProps,
} from "./collection-shared.js";
export type { ListBoxProps } from "./collection-shared.js";
export function ListBox({
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  onKeyDown,
  children,
  ref,
  ...props
}: ListBoxProps & RefProp<HTMLDivElement>) {
  const autocomplete = useAutocompleteContext();
  const collectionId = props.id ?? autocomplete?.defaultCollectionId;
  const setAutocompleteCollectionId = autocomplete?.setCollectionId;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const typeaheadSearch = useTypeaheadSearch();
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const itemVersion = useRef(0);
  const sortedItemCache = useRef<{
    version: number;
    items: CollectionItemRecord[];
  }>({ version: -1, items: [] });

  useEffect(() => {
    selectedRef.current = selected;
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const register = (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => {
    if (!element) {
      if (itemMap.current.delete(key)) itemVersion.current += 1;
      return;
    }

    const current = itemMap.current.get(key);
    if (
      current?.id !== element.id ||
      current?.textValue !== textValue ||
      current.element !== element ||
      current.disabled !== disabled
    ) {
      itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
      itemVersion.current += 1;
    }

    if (!selectedRef.current && !activeKeyRef.current && !disabled) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  };

  const items = () => {
    if (sortedItemCache.current.version !== itemVersion.current) {
      sortedItemCache.current = {
        version: itemVersion.current,
        items: sortItems([...itemMap.current.values()]),
      };
    }
    return sortedItemCache.current.items;
  };

  const context: SelectableCollectionContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey,
    setSelectedKey: setSelected,
    register,
    items,
  };

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

  return (
    <ListBoxContext value={context}>
      <div
        {...props}
        ref={composeRefs(ref, autocomplete?.collectionRef)}
        id={collectionId}
        role="listbox"
        aria-labelledby={props["aria-labelledby"]}
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const items = context.items();
          let key = getRovingFocusTarget(items, selected, event.key, { orientation, loop: true });
          if (!key && event.key.length === 1) {
            key = findTypeaheadMatch(items, typeaheadSearch(event.key), selected);
          }
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          setSelected(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      >
        {children}
      </div>
    </ListBoxContext>
  );
}
