import { useContext, useRef, type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { TableColumnContext } from "./table-shared.js";

export type TableColumnResizerProps = HTMLAttributes<HTMLSpanElement>;

/**
 * A pointer-drag handle inside a TableColumn that has onResize. Keyboard
 * resizing stays on the header itself (Shift+ArrowLeft/ArrowRight), so the
 * handle never adds a tab stop.
 */
export function TableColumnResizer({
  onPointerDown,
  ref,
  ...props
}: TableColumnResizerProps & RefProp<HTMLSpanElement>) {
  const column = useContext(TableColumnContext);
  const drag = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      data-slot={dataSlot(props, "table-column-resizer")}
      style={{ touchAction: "none", cursor: "col-resize", ...props.style }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || !column) return;
        const cell = column.element();
        if (!cell) return;
        event.preventDefault();
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: cell.offsetWidth,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId) return;
        column?.resize(Math.max(0, state.startWidth + event.clientX - state.startX));
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    />
  );
}
