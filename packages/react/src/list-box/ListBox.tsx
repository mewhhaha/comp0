import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import {
  useComposedRefs,
  useCollection,
  useCollectionNavigation,
  useControllableState,
} from "@comp0/core";
import { type ListBoxContextValue } from "./list-box-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useAutocompleteContext } from "../autocomplete/autocomplete-shared.js";
import { useMentionFieldListBoxContext } from "../mention-field/mention-field-shared.js";
import { useRenderedId } from "../internal/rendered-id.js";
import {
  rootEntryKey,
  useRootTabIndex,
  useTabStopSelection,
  useTabStopStore,
} from "../internal/tab-stop.js";
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
  onFocus,
  onKeyDown,
  children,
  ref,
  ...props
}: ListBoxProps) {
  const autocomplete = useAutocompleteContext();
  const mentionField = useMentionFieldListBoxContext();
  const collectionId = props.id ?? mentionField?.id ?? autocomplete?.defaultCollectionId;
  const setAutocompleteCollectionId = autocomplete?.setCollectionId;
  const attachAutocompleteCollection = autocomplete?.attachCollection;
  const [selected, setSelected] = useControllableState({
    value: mentionField ? "" : value,
    defaultValue: defaultValue ?? "",
    onChange(nextValue) {
      onChange?.(nextValue);
      mentionField?.select(nextValue);
    },
  });
  const navigate = useCollectionNavigation();
  const listRef = useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(ref, listRef);
  const collection = useCollection();
  // The option that last held focus or was chosen, recorded under the selection current at the
  // time: any change of selection drops it (clearing to "" keeps it), so a value that returns
  // later cannot revive a stale record. The stop lives outside React state, so a focus move
  // re-renders only the two options whose tabIndex changes (bench:
  // collection-tab-stop.bench.tsx, PERFORMANCE.md).
  const selection = useTabStopSelection(selected);
  const tabStops = useTabStopStore(collection);
  const setFocusedKey = (key: string) => {
    tabStops.focus(key, selection);
  };
  // Autocomplete and MentionField keep DOM focus in their input, so the list must not take it.
  const rootTabIndex = useRootTabIndex(tabStops, selection);
  const focusStaysOutside = autocomplete?.disableVirtualFocus === false || Boolean(mentionField);

  const context: ListBoxContextValue = {
    tabStops,
    selection,
    selectedKey: selected,
    setFocusedKey,
    setSelectedKey: setSelected,
    collection,
  };

  useLayoutEffect(() => {
    if (!collectionId || !setAutocompleteCollectionId || !attachAutocompleteCollection) return;
    setAutocompleteCollectionId(collectionId);
    const detach = attachAutocompleteCollection(collection);
    return () => {
      detach();
      setAutocompleteCollectionId((currentId) =>
        currentId === collectionId ? undefined : currentId,
      );
    };
  }, [attachAutocompleteCollection, collection, collectionId, setAutocompleteCollectionId]);

  // Reference the mention field's label only when one is rendered.
  const mentionLabel = useRenderedId(listRef, mentionField?.labelId, mentionField);
  let labelledBy = props["aria-labelledby"];
  if (props["aria-label"]) labelledBy = undefined;
  else labelledBy = labelledBy ?? mentionLabel;

  const Part = partElement(as, "div");
  return (
    <ListBoxContext value={context}>
      <Part
        {...props}
        ref={composedRef}
        id={collectionId}
        role="listbox"
        tabIndex={props.tabIndex ?? (focusStaysOutside ? undefined : rootTabIndex)}
        aria-labelledby={labelledBy}
        aria-orientation={orientation}
        data-orientation={orientation}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          const option = collection
            .items()
            .find((item) => item.element?.contains(event.target as Node));
          if (option && !option.disabled) setFocusedKey(option.key);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Arrows move from the option holding focus, not from the selection, so a controlled
          // value that rejects the move still advances to the next option.
          const options = {
            orientation,
            dir: writingDirection(event.currentTarget),
            loop: true,
          };
          const stop = tabStops.get(selection);
          if (event.target === event.currentTarget) {
            // Focus is on the list itself (focused before its options registered, or by a
            // click between options): enter at the stop without changing the selection.
            const entry = navigate(event.key, collection.items(), undefined, options);
            const entryKey = rootEntryKey(event.key, stop, entry);
            if (!entryKey) return;
            event.preventDefault();
            setFocusedKey(entryKey);
            collection.get(entryKey)?.element?.focus();
            return;
          }
          const key = navigate(event.key, collection.items(), stop, options);
          if (!key) return;
          event.preventDefault();
          setFocusedKey(key);
          setSelected(key);
          collection.get(key)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </ListBoxContext>
  );
}
