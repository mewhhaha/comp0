import { type ReactNode } from "react";
import { createRequiredContext } from "../internal/context.js";
import { type PopoverPlacement } from "../internal/overlay/placement.js";

export type TourStep = {
  target: string;
  title: ReactNode;
  description?: ReactNode | undefined;
  placement?: PopoverPlacement | undefined;
};

export type TourState = {
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  first: boolean;
  last: boolean;
  previous: () => void;
  next: () => void;
  close: () => void;
};

export type TourContextValue = {
  contentId: string;
  open: boolean;
  state: TourState | null;
  triggerId: string;
  focusTrigger: () => void;
  start: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
};

export const [TourContext, useTourContext] = createRequiredContext<TourContextValue>("Tour");
