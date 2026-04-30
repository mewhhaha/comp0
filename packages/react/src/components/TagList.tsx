import {
  createContext,
  useCallback,
  useEffect,
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
  remove: ((key: string) => void) | undefined;
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
  const sortedItemCache = useRef<{
    version: number;
    items: CollectionItemRecord[];
  }>({ version: -1, items: [] });

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const register = useCallback((key: string, element: HTMLElement | null, disabled?: boolean) => {
    if (!element) {
      if (itemMap.current.delete(key)) itemVersion.current += 1;
      if (activeKeyRef.current === key) {
        const next = sortItems([...itemMap.current.values()]).find((item) => !item.disabled);
        activeKeyRef.current = next?.key ?? "";
        setActiveKey(next?.key ?? "");
      }
      return;
    }

    const current = itemMap.current.get(key);
    if (current?.element !== element || current.disabled !== disabled) {
      itemMap.current.set(key, { key, textValue: key, element, disabled });
      itemVersion.current += 1;
    }

    if (!activeKeyRef.current && !disabled) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  }, []);

  const items = useCallback(() => {
    if (sortedItemCache.current.version !== itemVersion.current) {
      sortedItemCache.current = {
        version: itemVersion.current,
        items: sortItems([...itemMap.current.values()]),
      };
    }
    return sortedItemCache.current.items;
  }, []);

  const context = useMemo(
    () => ({ activeKey, setActiveKey, register, remove: onRemove }),
    [activeKey, onRemove, register],
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
          const key = getRovingFocusTarget(currentItems, activeKey, event.key, {
            orientation,
            loop: false,
          });
          if (!key || key === activeKey) return;
          event.preventDefault();
          flushSync(() => setActiveKey(key));
          for (const item of currentItems) {
            if (item.element && !item.disabled) item.element.tabIndex = item.key === key ? 0 : -1;
          }
          currentItems.find((item) => item.key === key)?.element?.focus();
        }}
      >
        {children}
      </div>
    </TagListContext.Provider>
  );
}
