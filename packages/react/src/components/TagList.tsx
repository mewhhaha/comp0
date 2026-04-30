import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { flushSync } from "react-dom";
import { getRovingFocusTarget } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";

export type TagListProps = Omit<HTMLAttributes<HTMLDivElement>, "onRemove"> & {
  onRemove?: ((id: string) => void) | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
};

export type TagListContextValue = {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (key: string, element: HTMLElement | null, disabled?: boolean) => void;
  remove: (key: string) => void;
};

export const TagListContext = createContext<TagListContextValue | null>(null);

export function TagList({
  children,
  onKeyDown,
  onRemove,
  orientation = "horizontal",
  ref,
  ...props
}: TagListProps & RefProp<HTMLDivElement>) {
  const [activeKey, setActiveKey] = useState("");
  const activeKeyRef = useRef(activeKey);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const itemVersion = useRef(0);
  const pendingFocusKey = useRef("");
  const sortedItemCache = useRef<{
    version: number;
    items: CollectionItemRecord[];
  }>({ version: -1, items: [] });

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const syncTabIndexes = useCallback((key: string) => {
    for (const item of itemMap.current.values()) {
      if (item.element && !item.disabled) item.element.tabIndex = item.key === key ? 0 : -1;
    }
  }, []);

  const setCurrentKey = useCallback(
    (key: string) => {
      activeKeyRef.current = key;
      syncTabIndexes(key);
      setActiveKey(key);
    },
    [syncTabIndexes],
  );

  const register = useCallback(
    (key: string, element: HTMLElement | null, disabled?: boolean) => {
      if (!element) {
        if (itemMap.current.delete(key)) itemVersion.current += 1;
        if (activeKeyRef.current === key) {
          const next = sortItems([...itemMap.current.values()]).find((item) => !item.disabled);
          setCurrentKey(next?.key ?? "");
        }
        return;
      }

      const current = itemMap.current.get(key);
      if (current?.element !== element || current.disabled !== disabled) {
        itemMap.current.set(key, { key, textValue: key, element, disabled });
        itemVersion.current += 1;
      }

      if (!activeKeyRef.current && !disabled) {
        setCurrentKey(key);
      }
    },
    [setCurrentKey],
  );

  const items = useCallback(() => {
    if (sortedItemCache.current.version !== itemVersion.current) {
      sortedItemCache.current = {
        version: itemVersion.current,
        items: sortItems([...itemMap.current.values()]),
      };
    }
    return sortedItemCache.current.items;
  }, []);

  useLayoutEffect(() => {
    const current = itemMap.current.get(activeKeyRef.current);
    if (!current || current.disabled) {
      const next = sortItems([...itemMap.current.values()]).find((item) => !item.disabled);
      if (next) setCurrentKey(next.key);
    }
    syncTabIndexes(activeKeyRef.current);
    if (!pendingFocusKey.current) return;
    const key = pendingFocusKey.current;
    const item = itemMap.current.get(key);
    if (!item?.element || item.disabled) return;
    pendingFocusKey.current = "";
    item.element.focus();
  });

  const remove = useCallback(
    (key: string) => {
      if (!onRemove) return;

      const enabledItems = items().filter((item) => !item.disabled);
      const index = enabledItems.findIndex((item) => item.key === key);
      const nextItem = enabledItems[index + 1] ?? enabledItems[index - 1];
      const nextKey = nextItem?.key ?? "";

      pendingFocusKey.current = nextKey;
      flushSync(() => {
        setCurrentKey(nextKey);
        onRemove(key);
      });
    },
    [items, onRemove, setCurrentKey],
  );

  const context = useMemo(
    () => ({ activeKey, setActiveKey: setCurrentKey, register, remove }),
    [activeKey, register, remove, setCurrentKey],
  );

  return (
    <TagListContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role="list"
        data-orientation={orientation}
        data-slot="tag-list"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const currentItems = items();
          const currentKey = activeKeyRef.current;
          const key = getRovingFocusTarget(currentItems, currentKey, event.key, {
            orientation,
            loop: false,
          });
          if (!key || key === currentKey) return;
          event.preventDefault();
          flushSync(() => setCurrentKey(key));
          currentItems.find((item) => item.key === key)?.element?.focus();
        }}
      >
        {children}
      </div>
    </TagListContext.Provider>
  );
}
