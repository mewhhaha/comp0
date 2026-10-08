import { createRequiredContext } from "../internal/context.js";

export type PreviewContextValue = {
  open: boolean;
  contentId: string;
  triggerId: string;
  setOpen: (open: boolean) => void;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  cancelClose: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
};

export const [PreviewContext, usePreviewContext] =
  createRequiredContext<PreviewContextValue>("Preview");
