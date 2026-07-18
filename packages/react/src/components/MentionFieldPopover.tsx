import { useLayoutEffect, useState, type CSSProperties, type HTMLAttributes } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { MentionFieldListBoxContext, useMentionFieldContext } from "./mention-field-shared.js";
import { usePopoverSurface } from "./overlay-shared.js";

type Coordinates = { left: number; top: number };

export type MentionFieldPopoverProps = Omit<HTMLAttributes<HTMLDivElement>, "popover"> & {
  /** Gap between the caret and the suggestions in pixels. */
  offset?: number | undefined;
};

export function MentionFieldPopover({
  offset = 4,
  onToggle,
  ref,
  style,
  ...props
}: MentionFieldPopoverProps & RefProp<HTMLDivElement>) {
  const field = useFieldContext();
  const mentionField = useMentionFieldContext();
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("manual");
  const composedRef = useComposedRefs(ref, surfaceRef);
  const [coordinates, setCoordinates] = useState<Coordinates>({ left: 0, top: 0 });
  if (!mentionField || !popover) {
    throw new Error("MentionFieldPopover must be rendered inside MentionField.");
  }

  useLayoutEffect(() => {
    if (!popover.open) return;

    const updatePosition = () => {
      const surface = surfaceRef.current;
      const caret = mentionField.refreshCaretRect() ?? mentionField.caretRect;
      const window = surface?.ownerDocument.defaultView;
      if (!surface || !caret || !window) return;
      const surfaceRect = surface.getBoundingClientRect();
      const edgeGap = 8;
      let left = caret.left;
      let top = caret.bottom + offset;
      if (left + surfaceRect.width > window.innerWidth - edgeGap) {
        left = window.innerWidth - surfaceRect.width - edgeGap;
      }
      if (left < edgeGap) left = edgeGap;
      if (
        top + surfaceRect.height > window.innerHeight - edgeGap &&
        caret.top - surfaceRect.height - offset >= edgeGap
      ) {
        top = caret.top - surfaceRect.height - offset;
      }
      setCoordinates((current) =>
        current.left === left && current.top === top ? current : { left, top },
      );
    };

    updatePosition();
    const window = surfaceRef.current?.ownerDocument.defaultView;
    window?.addEventListener("resize", updatePosition);
    window?.addEventListener("scroll", updatePosition, true);
    return () => {
      window?.removeEventListener("resize", updatePosition);
      window?.removeEventListener("scroll", updatePosition, true);
    };
  }, [mentionField, offset, popover.open, surfaceRef]);

  const positionedStyle = {
    inset: "auto",
    left: coordinates.left,
    margin: 0,
    position: "fixed",
    top: coordinates.top,
    ...style,
  } as CSSProperties;

  return (
    <div
      {...props}
      ref={composedRef}
      id={props.id ?? `${popover.contentId}-popover`}
      popover="manual"
      hidden={!popover.open}
      style={positionedStyle}
      data-open={dataAttr(popover.open)}
      data-trigger={mentionField.match?.trigger}
      onToggle={(event) => {
        onToggle?.(event);
        if (event.target !== event.currentTarget || event.defaultPrevented) return;
        onNativeToggle(event.newState === "open");
      }}
    >
      <MentionFieldListBoxContext
        value={{
          id: popover.contentId,
          labelId: field?.labelId,
          select: mentionField.replaceMatch,
        }}
      >
        {props.children}
      </MentionFieldListBoxContext>
    </div>
  );
}
