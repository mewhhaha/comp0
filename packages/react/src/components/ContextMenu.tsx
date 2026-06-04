import { useId, useMemo, useRef, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { ContextMenuContext } from "./context-menu-shared.js";
import { type ContextMenuProps } from "./context-menu-shared.js";
export type { ContextMenuProps } from "./context-menu-shared.js";

export function ContextMenu({
  open: openProp,
  defaultOpen = false,
  onChange,
  ref,
  ...props
}: ContextMenuProps & RefProp<HTMLDivElement>) {
  const generatedId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });
  const [position, setPosition] = useState<{ x: number | undefined; y: number | undefined }>({
    x: undefined,
    y: undefined,
  });
  const context = useMemo(
    () => ({
      open,
      triggerId: `${props.id ?? generatedId}-trigger`,
      contentId: `${props.id ?? generatedId}-menu`,
      x: position.x,
      y: position.y,
      setOpen,
      openAt(x: number | undefined, y: number | undefined) {
        setPosition({ x, y });
        setOpen(true);
      },
      focusTrigger() {
        triggerRef.current?.focus();
      },
      setTriggerElement(element: HTMLElement | null) {
        triggerRef.current = element;
      },
    }),
    [generatedId, open, position.x, position.y, props.id, setOpen],
  );

  return (
    <ContextMenuContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        data-open={dataAttr(open)}
        data-slot={dataSlot(props, "context-menu")}
      />
    </ContextMenuContext.Provider>
  );
}
