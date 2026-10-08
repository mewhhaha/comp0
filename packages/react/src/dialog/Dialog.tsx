import { useId, useRef, type ReactNode } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { DialogContext } from "../internal/overlay/context.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type DialogProps = RootProps<{
  /** Base for the generated trigger and content ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Dialog({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  ...props
}: DialogProps) {
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
    <DialogContext value={context}>
      <Root {...props} id={id} data-open={dataAttr(open)} data-slot={dataSlot(props, "dialog")}>
        {children}
      </Root>
    </DialogContext>
  );
}
