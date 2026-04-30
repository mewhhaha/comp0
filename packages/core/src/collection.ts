import { useCallback, useRef } from "react";

export interface CollectionNode<TValue = string> {
  key: string;
  value: TValue;
  textValue: string;
  disabled?: boolean;
  element: HTMLElement | null;
}

export function sortByDocumentPosition<TValue>(items: CollectionNode<TValue>[]) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });
}

export function useCollectionRegistry<TValue = string>() {
  const itemsRef = useRef(new Map<string, CollectionNode<TValue>>());

  const register = useCallback((node: CollectionNode<TValue>) => {
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
