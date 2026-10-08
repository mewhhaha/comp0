import { useLayoutEffect, useState, type CSSProperties, type ComponentProps } from "react";
import { useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOverlaySurface, useRequiredPopoverContext } from "../internal/overlay/index.js";
import {
  MentionFieldListBoxContext,
  useRequiredMentionFieldContext,
} from "./mention-field-shared.js";

type Coordinates = { left: number; top: number };

export type MentionFieldPopoverProps = Omit<ComponentProps<"div">, "popover"> &
  AsProp & {
    /** Gap between the caret and the suggestions in pixels. */
    offset?: number | undefined;
  };

export function MentionFieldPopover({
  as,
  offset = 4,
  onToggle,
  ref,
  style,
  ...props
}: MentionFieldPopoverProps) {
  const field = useFieldContext();
  const mentionField = useRequiredMentionFieldContext("MentionFieldPopover");
  const [coordinates, setCoordinates] = useState<Coordinates>({ left: 0, top: 0 });
  const positionedStyle = {
    inset: "auto",
    left: coordinates.left,
    margin: 0,
    position: "fixed",
    top: coordinates.top,
    ...style,
  } as CSSProperties;
  const surface = useOverlaySurface<HTMLDivElement>({
    id: props.id,
    onToggle,
    popover: "manual",
    ref,
    style: positionedStyle,
  });
  const popover = useRequiredPopoverContext("MentionFieldPopover");
  const { open, surfaceRef } = surface;

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const element = surfaceRef.current;
      const caret = mentionField.refreshCaretRect() ?? mentionField.caretRect;
      const window = element?.ownerDocument.defaultView;
      if (!element || !caret || !window) return;
      const surfaceRect = element.getBoundingClientRect();
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
  }, [mentionField, offset, open, surfaceRef]);

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      {...surface.props}
      id={props.id ?? `${popover.contentId}-popover`}
      data-trigger={mentionField.match?.trigger}
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
    </Part>
  );
}
