import { dataAttr } from "@comp0/core";
import { type ReactNode } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { DialogContent, type DialogContentProps } from "./DialogContent.js";
import { placementSurfaceStyle } from "./overlay-shared.js";
import { useTourContext, type TourState } from "./tour-shared.js";

export type TourOverlayProps = Omit<DialogContentProps, "children"> & {
  children: ReactNode | ((state: TourState) => ReactNode);
  offset?: number | undefined;
};

export function TourOverlay({
  children,
  offset,
  onClose,
  style,
  ...props
}: TourOverlayProps & RefProp<HTMLDialogElement>) {
  const tour = useTourContext();
  const state = tour?.state;
  const content = state && (typeof children === "function" ? children(state) : children);

  return (
    <DialogContent
      {...props}
      style={placementSurfaceStyle(
        state?.step.placement ?? "bottom",
        offset,
        tour?.triggerId,
        style,
      )}
      data-step={state?.stepIndex}
      data-target={state?.step.target}
      data-first={dataAttr(state?.first)}
      data-last={dataAttr(state?.last)}
      data-slot={dataSlot(props, "tour-overlay")}
      onClose={(event) => {
        onClose?.(event);
        queueMicrotask(() => tour?.focusTrigger());
      }}
    >
      {content}
    </DialogContent>
  );
}
