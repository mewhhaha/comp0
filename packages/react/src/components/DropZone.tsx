import { type RefProp } from "../shared.js";
import { useRef, useState } from "react";
import { dataAttr } from "@comp0/core";
import { hasFileDrag, acceptFileDrag } from "./parity-shared.js";
import { type DropZoneProps } from "./parity-shared.js";
export type { DropZoneProps } from "./parity-shared.js";
export function DropZone({
  disabled,
  children,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  role,
  tabIndex,
  ref,
  ...props
}: DropZoneProps & RefProp<HTMLDivElement>) {
  const dragDepthRef = useRef(0);
  const [dropTarget, setDropTarget] = useState(false);
  const resolvedDisabled = Boolean(disabled);

  return (
    <div
      {...props}
      ref={ref}
      role={role ?? "group"}
      tabIndex={resolvedDisabled ? undefined : tabIndex}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-drop-target={dataAttr(dropTarget)}
      data-slot="drop-zone"
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (event.defaultPrevented || resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        dragDepthRef.current += 1;
        setDropTarget(true);
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) setDropTarget(false);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented || resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        setDropTarget(true);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (resolvedDisabled || !hasFileDrag(event.dataTransfer)) return;
        acceptFileDrag(event);
        dragDepthRef.current = 0;
        setDropTarget(false);
      }}
    >
      {children}
    </div>
  );
}
