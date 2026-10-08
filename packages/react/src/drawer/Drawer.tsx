import { useId, useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { DrawerContext, type DrawerSide } from "./drawer-shared.js";

export type DrawerProps = RootProps<{
  /** Base for the generated trigger and content ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  /** Edge of the viewport the panel is anchored to; swiping toward it dismisses the drawer. */
  side?: DrawerSide | undefined;
  children?: ReactNode | undefined;
}>;

export function Drawer({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  side = "right",
  ...props
}: DrawerProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const context = {
    open,
    setOpen,
    side,
    triggerId: `${baseId}-trigger`,
    contentId: `${baseId}-content`,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    setTriggerElement(element: HTMLElement | null) {
      triggerRef.current = element;
    },
  };

  const Root = rootElement(as);
  return (
    <DrawerContext value={context}>
      <Root {...props} id={id} data-open={dataAttr(open)} data-slot={dataSlot(props, "drawer")}>
        {children}
      </Root>
    </DrawerContext>
  );
}
