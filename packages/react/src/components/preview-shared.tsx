import { createContext, useContext } from "react";

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

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreviewContext() {
  return useContext(PreviewContext);
}
