import { useCallback, useRef } from "react";

/** A logical collection entry, independent from the element used to render it. */
export type CollectionNode<TValue = string, TKey = string> = {
  /** Stable application identity used for selection, focus, and collection lookup. */
  key: TKey;
  /** The DOM id of the rendered element, when the collection participates in ARIA relationships. */
  id: string;
  value: TValue;
  textValue: string;
  disabled?: boolean;
  element: HTMLElement | null;
};

/** Returns a copy of collection entries in their current DOM order. */
export function sortByDocumentPosition<TValue, TKey>(items: CollectionNode<TValue, TKey>[]) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });
}

/**
 * Registers collection entries and reads them in DOM order.
 *
 * `key` identifies the logical item; `id` remains available for DOM and ARIA references.
 */
type CollectionRegistry<TValue, TKey> = {
  register: (node: CollectionNode<TValue, TKey>) => () => void;
  getItems: () => CollectionNode<TValue, TKey>[];
  getEnabledItems: () => CollectionNode<TValue, TKey>[];
};

export function useCollectionRegistry<TValue = string, TKey = string>(): CollectionRegistry<
  TValue,
  TKey
>;
export function useCollectionRegistry(): CollectionRegistry<unknown, unknown> {
  const itemsRef = useRef(new Map<unknown, CollectionNode<unknown, unknown>>());

  const register = useCallback((node: CollectionNode<unknown, unknown>) => {
    itemsRef.current.set(node.key, node);
    return () => {
      itemsRef.current.delete(node.key);
    };
  }, []);

  const getItems = useCallback(() => sortByDocumentPosition([...itemsRef.current.values()]), []);
  const getEnabledItems = useCallback(
    () => getItems().filter((item) => !item.disabled),
    [getItems],
  );

  return { register, getItems, getEnabledItems };
}
