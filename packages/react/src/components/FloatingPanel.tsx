import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
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
  const { activeId, activate, boundary, register, stack, unregister } = group;
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
  const positionRef = useRef(position);
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

  useLayoutEffect(() => {
    const boundaryRect = boundary?.current?.getBoundingClientRect();
    const surfaceRect = surfaceRef.current?.getBoundingClientRect();
    if (!open || positionRef.current || !boundaryRect || !surfaceRect) return;
    const nextPosition = {
      x: Math.min(
        Math.max(boundaryRect.left, surfaceRect.left),
        Math.max(boundaryRect.left, boundaryRect.right - surfaceRect.width),
      ),
      y: Math.min(
        Math.max(boundaryRect.top, surfaceRect.top),
        Math.max(boundaryRect.top, boundaryRect.bottom - surfaceRect.height),
      ),
    };
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, [boundary, open, setPosition]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

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
  const setPanelPosition = (nextPosition: FloatingPanelPosition) => {
    positionRef.current = nextPosition;
    setPosition(nextPosition);
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
    const boundaryRect = boundary?.current?.getBoundingClientRect();
    const left = boundaryRect?.left ?? 0;
    const top = boundaryRect?.top ?? 0;
    const right = boundaryRect?.right ?? ownerWindow.innerWidth;
    const bottom = boundaryRect?.bottom ?? ownerWindow.innerHeight;
    return {
      x: Math.min(Math.max(left, nextPosition.x), Math.max(left, right - rect.width)),
      y: Math.min(Math.max(top, nextPosition.y), Math.max(top, bottom - rect.height)),
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
    setPanelPosition(nextPosition);
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
    setPanelPosition(
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
    setPanelPosition(move.position);
    clearPointerMove(event);
    setAnnouncement("Panel movement cancelled.");
  };

  useEffect(() => {
    const boundaryElement = boundary?.current;
    const ownerWindow = boundaryElement?.ownerDocument.defaultView;
    if (!boundaryElement || !ownerWindow) return;
    let previousRect = boundaryElement.getBoundingClientRect();
    const followBoundary = () => {
      const nextRect = boundaryElement.getBoundingClientRect();
      const current = positionRef.current;
      const surfaceRect = surfaceRef.current?.getBoundingClientRect();
      const deltaX = nextRect.left - previousRect.left;
      const deltaY = nextRect.top - previousRect.top;
      previousRect = nextRect;
      if (!current || !surfaceRect) return;
      const nextPosition = {
        x: Math.min(
          Math.max(nextRect.left, current.x + deltaX),
          Math.max(nextRect.left, nextRect.right - surfaceRect.width),
        ),
        y: Math.min(
          Math.max(nextRect.top, current.y + deltaY),
          Math.max(nextRect.top, nextRect.bottom - surfaceRect.height),
        ),
      };
      if (nextPosition.x === current.x && nextPosition.y === current.y) return;
      positionRef.current = nextPosition;
      setPosition(nextPosition);
    };
    ownerWindow.addEventListener("scroll", followBoundary, true);
    ownerWindow.addEventListener("resize", followBoundary);
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(followBoundary);
    observer?.observe(boundaryElement);
    return () => {
      ownerWindow.removeEventListener("scroll", followBoundary, true);
      ownerWindow.removeEventListener("resize", followBoundary);
      observer?.disconnect();
    };
  }, [boundary, setPosition]);

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
        boundary,
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
        setPosition: setPanelPosition,
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
