import { type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { DialogContent, type DialogContentProps } from "../dialog/DialogContent.js";
import { placementSurfaceStyle } from "../internal/overlay/placement.js";
import { useTourContext, type TourState } from "./tour-shared.js";

export type TourContentProps = Omit<DialogContentProps, "children"> & {
  /** Content for the active step; a function receives the step and its navigation actions. */
  children: ReactNode | ((state: TourState) => ReactNode);
  offset?: number | undefined;
};

export function TourContent({ children, offset, onClose, style, ...props }: TourContentProps) {
  const tour = useTourContext("TourContent");
  const state = tour.state;
  const content = state && (typeof children === "function" ? children(state) : children);

  return (
    <DialogContent
      data-slot="tour-content"
      {...props}
      style={placementSurfaceStyle(
        state?.step.placement ?? "bottom",
        offset,
        tour.triggerId,
        style,
      )}
      data-step={state?.stepIndex}
      data-target={state?.step.target}
      data-first={dataAttr(state?.first)}
      data-last={dataAttr(state?.last)}
      onClose={(event) => {
        onClose?.(event);
        queueMicrotask(() => tour.focusTrigger());
      }}
    >
      {content}
    </DialogContent>
  );
}
