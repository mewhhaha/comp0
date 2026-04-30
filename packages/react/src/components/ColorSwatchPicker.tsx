import {
  createContext,
  useCallback,
  useContext,
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
import { ColorContext } from "./color-shared.js";

export type ColorSwatchPickerContextValue = {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (key: string, element: HTMLElement | null, disabled?: boolean) => void;
};

export const ColorSwatchPickerContext = createContext<ColorSwatchPickerContextValue | null>(null);

export function ColorSwatchPicker({
  onKeyDown,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const color = useContext(ColorContext);
  const [activeKey, setActiveKey] = useState(() => color?.value.toLocaleLowerCase() ?? "");
  const activeKeyRef = useRef(activeKey);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const itemVersion = useRef(0);
  const sortedItemCache = useRef<{
    version: number;
    items: CollectionItemRecord[];
  }>({ version: -1, items: [] });

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
        return;
      }

      const current = itemMap.current.get(key);
      if (current?.element !== element || current.disabled !== disabled) {
        itemMap.current.set(key, { key, textValue: key, element, disabled });
        itemVersion.current += 1;
      }

      if (!activeKeyRef.current && !disabled) setCurrentKey(key);
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
    const selectedKey = color?.value.toLocaleLowerCase() ?? "";
    if (selectedKey && itemMap.current.has(selectedKey)) setCurrentKey(selectedKey);
  }, [color?.value, setCurrentKey]);

  useLayoutEffect(() => {
    const current = itemMap.current.get(activeKeyRef.current);
    if (!current || current.disabled) {
      const next = items().find((item) => !item.disabled);
      if (next) setCurrentKey(next.key);
    }
    syncTabIndexes(activeKeyRef.current);
  });

  const context = useMemo(
    () => ({ activeKey, setActiveKey: setCurrentKey, register }),
    [activeKey, register, setCurrentKey],
  );

  return (
    <ColorSwatchPickerContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role="listbox"
        data-slot="color-swatch-picker"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const currentItems = items();
          const currentKey = activeKeyRef.current;
          const key = getRovingFocusTarget(currentItems, currentKey, event.key, {
            orientation: "both",
            loop: true,
          });
          if (!key || key === currentKey) return;
          event.preventDefault();
          flushSync(() => setCurrentKey(key));
          currentItems.find((item) => item.key === key)?.element?.focus();
        }}
      />
    </ColorSwatchPickerContext.Provider>
  );
}
