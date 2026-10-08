import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import {
  useComposedRefs,
  useCollection,
  useCollectionNavigation,
  useControllableState,
  type CollectionItem,
} from "@comp0/core";
import { type ListBoxContextValue } from "./list-box-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useMentionFieldListBoxContext } from "../mention-field/mention-field-shared.js";
import { writingDirection } from "../internal/writing-direction.js";
import { ListBoxContext } from "./list-box-shared.js";

export type ListBoxProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    value?: string | undefined;
    defaultValue?: string | undefined;
    onChange?: ((value: string) => void) | undefined;
    orientation?: "vertical" | "horizontal" | undefined;
  };

export function ListBox({
  as,
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  onKeyDown,
  children,
  ref,
  ...props
}: ListBoxProps) {
  const autocomplete = useAutocompleteContext();
  const mentionField = useMentionFieldListBoxContext();
  const collectionId = props.id ?? mentionField?.id ?? autocomplete?.defaultCollectionId;
  const setAutocompleteCollectionId = autocomplete?.setCollectionId;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;
  const [selected, setSelected] = useControllableState({
    value: mentionField ? "" : value,
    defaultValue: defaultValue ?? "",
    onChange(nextValue) {
      onChange?.(nextValue);
      mentionField?.select(nextValue);
    },
  });
  const navigate = useCollectionNavigation();
  const composedRef = useComposedRefs(ref, autocomplete?.collectionRef);
  const collection = useCollection();
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);

  const syncOptionTabStops = (key: string) => {
    const virtualFocus = autocomplete !== null && !autocomplete.disableVirtualFocus;
    for (const item of collection.items()) {
      if (!item.element || item.disabled) continue;
      item.element.tabIndex = !virtualFocus && item.key === key ? 0 : -1;
    }
  };

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

  const register = (item: CollectionItem) => {
    const { key, disabled } = item;
    collection.register(item);
    if (!item.element) {
      if (activeKeyRef.current === key) {
        const fallback = collection.enabledItems()[0]?.key ?? "";
        activeKeyRef.current = fallback;
        syncOptionTabStops(fallback);
        setActiveKey(fallback);
      }
      return;
    }

    if (selectedRef.current === key && !disabled) {
      activeKeyRef.current = key;
      syncOptionTabStops(key);
      setActiveKey(key);
      return;
    }
    const activeItem = collection.get(activeKeyRef.current);
    if ((!activeItem || activeItem.disabled) && !disabled) {
      activeKeyRef.current = key;
      syncOptionTabStops(key);
      setActiveKey(key);
    }
  };

  const context: ListBoxContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey,
    setSelectedKey: setSelected,
    register,
    items: collection.items,
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

  const Part = partElement(as, "div");
  return (
    <ListBoxContext value={context}>
      <Part
        {...props}
        ref={composedRef}
        id={collectionId}
        role="listbox"
        aria-labelledby={
          props["aria-label"] ? undefined : (props["aria-labelledby"] ?? mentionField?.labelId)
        }
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const key = navigate(event.key, collection.items(), selected, {
            orientation,
            dir: writingDirection(event.currentTarget),
            loop: true,
          });
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          setSelected(key);
          collection.get(key)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </ListBoxContext>
  );
}
