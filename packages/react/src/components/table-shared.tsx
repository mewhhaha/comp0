import { createContext, useCallback, useContext, useId, useRef } from "react";

export interface TableContextValue {
  activeKey: string;
  setActiveKey: (key: string) => void;
  register: (key: string, element: HTMLTableCellElement | null) => void;
  keyFor: (element: Element) => string | undefined;
}

export const TableContext = createContext<TableContextValue | null>(null);

/** Registration and roving tabindex shared by header and body cells. */
export function useTableCell(ref: React.Ref<HTMLTableCellElement> | undefined) {
  const table = useContext(TableContext);
  const key = useId().replace(/:/g, "");
  const register = table?.register;
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  const cellRef = useCallback(
    (element: HTMLTableCellElement | null) => {
      elementRef.current = element;
      register?.(key, element);
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [key, ref, register],
  );
  const tabIndex = table?.activeKey === key ? 0 : -1;
  return { cellRef, tabIndex };
}
