import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import {
  FloatingPanelContext,
  useFloatingPanelGroupContext,
  type FloatingPanelPosition,
  type FloatingPanelSize,
} from "./floating-panel-shared.js";
export type { FloatingPanelPosition, FloatingPanelSize } from "./floating-panel-shared.js";

export type FloatingPanelProps = {
  children?: ReactNode | undefined;
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onToggle?: ((open: boolean) => void) | undefined;
  position?: FloatingPanelPosition | null | undefined;
  defaultPosition?: FloatingPanelPosition | null | undefined;
  onPositionChange?: ((position: FloatingPanelPosition) => void) | undefined;
  size?: FloatingPanelSize | null | undefined;
  defaultSize?: FloatingPanelSize | null | undefined;
  onSizeChange?: ((size: FloatingPanelSize) => void) | undefined;
};

type PointerMove = {
  pointerId: number;
  startX: number;
  startY: number;
  position: FloatingPanelPosition;
};

function finitePosition(position: FloatingPanelPosition | null, name: string) {
  if (!position) return;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new Error(`${name} must contain finite x and y coordinates.`);
  }
}

function finiteSize(size: FloatingPanelSize | null, name: string) {
  if (!size) return;
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    throw new Error(`${name} must contain finite width and height values.`);
  }
  if (size.width <= 0 || size.height <= 0) {
    throw new Error(`${name} width and height must be greater than 0.`);
  }
}

export function FloatingPanel({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onToggle,
  position: positionProp,
  defaultPosition = null,
  onPositionChange,
  size: sizeProp,
  defaultSize = null,
  onSizeChange,
}: FloatingPanelProps) {
  finitePosition(
    positionProp === undefined ? defaultPosition : positionProp,
    "FloatingPanel position",
  );
  finiteSize(sizeProp === undefined ? defaultSize : sizeProp, "FloatingPanel size");
  const group = useFloatingPanelGroupContext("FloatingPanel");
  const { activeId, activate, register, stack, unregister } = group;
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const triggerRef = useRef<HTMLElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef(false);
  const pointerMove = useRef<PointerMove | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [moving, setMoving] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onToggle,
  });
  const [position, setPosition] = useControllableState<FloatingPanelPosition | null>({
    value: positionProp,
    defaultValue: defaultPosition,
    onChange: (next) => {
      if (next) onPositionChange?.(next);
    },
  });
  const [size, setSize] = useControllableState<FloatingPanelSize | null>({
    value: sizeProp,
    defaultValue: defaultSize,
    onChange: (next) => {
      if (next) onSizeChange?.(next);
    },
  });
  const contentId = `${baseId}-content`;
  const titleId = `${baseId}-title`;
  const triggerId = `${baseId}-trigger`;

  useEffect(() => {
    register(baseId, {
      open,
      surface: surfaceRef.current,
      trigger: triggerRef.current,
      lastFocused: null,
    });
  }, [baseId, open, register]);
  useEffect(() => () => unregister(baseId), [baseId, unregister]);

  const setOpen = (nextOpen: boolean) => {
    if (!nextOpen) restoreFocus.current = false;
    setOpenState(nextOpen);
  };
  const requestClose = () => {
    restoreFocus.current = true;
    setOpenState(false);
  };
  const measure = () => surfaceRef.current?.getBoundingClientRect();
  const getPosition = () => {
    const rect = measure();
    return position ?? (rect ? { x: rect.left, y: rect.top } : undefined);
  };
  const constrainPosition = (nextPosition: FloatingPanelPosition) => {
    const rect = measure();
    const ownerWindow = surfaceRef.current?.ownerDocument.defaultView;
    if (!rect || !ownerWindow) return nextPosition;
    return {
      x: Math.min(Math.max(0, nextPosition.x), Math.max(0, ownerWindow.innerWidth - rect.width)),
      y: Math.min(Math.max(0, nextPosition.y), Math.max(0, ownerWindow.innerHeight - rect.height)),
    };
  };
  const announcePosition = (nextPosition: FloatingPanelPosition) => {
    setAnnouncement(
      `Panel moved to ${Math.round(nextPosition.x)} pixels from the left and ${Math.round(nextPosition.y)} pixels from the top.`,
    );
  };
  const moveBy = (x: number, y: number) => {
    const current = getPosition();
    if (!current) return;
    const nextPosition = constrainPosition({ x: current.x + x, y: current.y + y });
    setPosition(nextPosition);
    announcePosition(nextPosition);
  };
  const startPointerMove = (
    event: PointerEvent<HTMLElement>,
    startingPosition?: FloatingPanelPosition,
  ) => {
    const current = startingPosition ?? getPosition();
    if (!current) return;
    event.preventDefault();
    pointerMove.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position: current,
    };
    setMoving(true);
    activate(baseId, event.currentTarget);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const continuePointerMove = (event: PointerEvent<HTMLElement>) => {
    const move = pointerMove.current;
    if (!move || move.pointerId !== event.pointerId) return;
    setPosition(
      constrainPosition({
        x: move.position.x + event.clientX - move.startX,
        y: move.position.y + event.clientY - move.startY,
      }),
    );
  };
  const clearPointerMove = (event: PointerEvent<HTMLElement>) => {
    pointerMove.current = null;
    setMoving(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const finishPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (pointerMove.current?.pointerId !== event.pointerId) return;
    const current = getPosition();
    clearPointerMove(event);
    if (current) announcePosition(current);
  };
  const cancelPointerMove = (event: PointerEvent<HTMLElement>) => {
    const move = pointerMove.current;
    if (!move || move.pointerId !== event.pointerId) return;
    setPosition(move.position);
    clearPointerMove(event);
    setAnnouncement("Panel movement cancelled.");
  };

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    triggerRef.current?.focus();
  }, [open]);

  const stackIndex = stack.indexOf(baseId);
  return (
    <FloatingPanelContext
      value={{
        active: activeId === baseId,
        announcement,
        announce(message) {
          setAnnouncement(message);
        },
        contentId,
        moving,
        open,
        position,
        resizing,
        size,
        surfaceRef,
        titleId,
        triggerId,
        activate(focused) {
          activate(baseId, focused);
        },
        cancelPointerMove,
        continuePointerMove,
        finishPointerMove,
        getPosition,
        measure,
        moveBy,
        requestClose,
        setMoving,
        setOpen,
        setPosition,
        setResizing,
        setSize,
        setSurfaceElement(element) {
          surfaceRef.current = element;
        },
        setTriggerElement(element) {
          triggerRef.current = element;
        },
        startPointerMove,
        stackIndex,
      }}
    >
      {children}
    </FloatingPanelContext>
  );
}
