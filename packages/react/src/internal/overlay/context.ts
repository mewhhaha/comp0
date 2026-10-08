import { createRequiredContext } from "../context.js";

export type OverlayContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  focusTrigger: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
};

export type PopoverContextValue = OverlayContextValue & {
  requestClose: () => void;
};

export type TooltipContextValue = OverlayContextValue & {
  cancelClose: () => void;
  scheduleClose: () => void;
};

export const [DialogContext, useRequiredDialogContext] =
  createRequiredContext<OverlayContextValue>("Dialog");

/**
 * Popover roots (Popover, Tooltip, Preview) and picker roots (Select, Combobox, DatePicker, ...)
 * provide this. The optional reader serves parts that also work without an open-state owner.
 */
export const [PopoverContext, useRequiredPopoverContext, usePopoverContext] =
  createRequiredContext<PopoverContextValue>("Popover");

export const [TooltipContext, useRequiredTooltipContext] =
  createRequiredContext<TooltipContextValue>("Tooltip");
