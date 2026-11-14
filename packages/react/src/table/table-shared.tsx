import { useId, useRef, useState, type Ref } from "react";
import { useComposedRefs, type Collection } from "@comp0/core";
import { useRenderOrderSeed, type CollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { adoptCell } from "./table-dom.js";

export type TableContextValue = {
  /** The render-order record cells fill on the server and while hydrating. */
  seed: CollectionSeed;
  /** Rows that carry a value, in document order, for range selection. */
  rows: Collection;
};

export const [TableContext, useTableContext, useOptionalTableContext] =
  createRequiredContext<TableContextValue>("Table");

export type TableColumnContextValue = {
  resize: (width: number) => void;
  element: () => HTMLTableCellElement | null;
};

export const [TableColumnContext, useTableColumnContext, useOptionalTableColumnContext] =
  createRequiredContext<TableColumnContextValue>("TableColumn");

// A cell rendered outside a Table records nothing, never holds a stop, and leaves its widgets
// alone, but its hooks still run unconditionally.
const DETACHED_SEED: CollectionSeed = {
  add() {},
  resolve: () => null,
  clear() {},
};

/**
 * The `tabIndex` a cell renders, decided once and never changed: rendered once, then owned by
 * the DOM. The table keeps its roving stop in the cells' tabindex attributes (`table-dom.ts`),
 * and because the cell passes React the same value on every render, React never writes the
 * attribute again after mount, so the table's handlers can move it without React undoing it.
 *
 * On the server and while hydrating, cells record themselves in render order and the first one
 * renders 0, so server HTML already has exactly one stop and hydration matches it. There is no
 * collection pass because its hidden div is invalid inside table markup. On a client-only mount
 * the seed is empty and every cell renders -1; the table puts the stop in the DOM on mount.
 *
 * The value belongs to the component, not to its element: when React replaces the element (its
 * `as` changes, a header gains `onResize`) the new one renders the same value again. Each element
 * therefore repairs itself from the DOM when it attaches (`adoptCell`), which is also when a cell
 * inside a Suspense boundary has hydrated and may be written.
 */
export function useTableCell(ref: Ref<HTMLTableCellElement> | undefined) {
  const table = useOptionalTableContext();
  const seed = table?.seed ?? DETACHED_SEED;
  const key = useId();
  // Cells are never disabled.
  useRenderOrderSeed(seed, key, false);
  const [tabIndex] = useState(() => (seed.resolve([]) === key ? 0 : -1));
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  const cellRef = useComposedRefs<HTMLTableCellElement>(
    ref,
    elementRef,
    table ? adoptCell : undefined,
  );
  return { cellRef, elementRef, tabIndex };
}
