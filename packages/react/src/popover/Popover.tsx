import { useId, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { PopoverContext, usePopoverState } from "../internal/overlay/index.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type PopoverProps = RootProps<{
  /** Base for the generated trigger and content ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Popover({
  as,
  children,
  defaultOpen = false,
  id,
  onToggle,
  open: openProp,
  ...props
}: PopoverProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const context = usePopoverState({
    open: openProp,
    defaultOpen,
    onToggle,
    triggerId: `${baseId}-trigger`,
    contentId: `${baseId}-content`,
  });

  const Root = rootElement(as);
  return (
    <PopoverContext value={context}>
      <Root
        {...props}
        id={id}
        data-open={dataAttr(context.open)}
        data-slot={dataSlot(props, "popover")}
      >
        {children}
      </Root>
    </PopoverContext>
  );
}
