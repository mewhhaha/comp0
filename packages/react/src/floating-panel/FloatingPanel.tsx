import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import {
  FloatingPanelContext,
  useFloatingPanelGroupContext,
  type FloatingPanelPosition,
  type FloatingPanelSize,
} from "./floating-panel-shared.js";
export type { FloatingPanelPosition, FloatingPanelSize } from "./floating-panel-shared.js";

type PointerMove = {
  pointerId: number;
  startX: number;
  startY: number;
  position: FloatingPanelPosition;
};

/** Returns the position when valid; otherwise warns and returns null so the panel falls back to its anchored placement. */
function validPosition(position: FloatingPanelPosition | null | undefined, name: string) {
  if (!position) return null;
  if (Number.isFinite(position.x) && Number.isFinite(position.y)) return position;
  warnOnce(
    `FloatingPanel:position:${position.x}:${position.y}`,
    `${name} must contain finite x and y coordinates. It was ignored.`,
  );
  return null;
}

/** Returns the size when valid; otherwise warns and returns null so the panel keeps its natural size. */
function validSize(size: FloatingPanelSize | null | undefined, name: string) {
  if (!size) return null;
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    warnOnce(
      `FloatingPanel:size-finite:${size.width}:${size.height}`,
      `${name} must contain finite width and height values. It was ignored.`,
    );
    return null;
  }
  if (size.width <= 0 || size.height <= 0) {
    warnOnce(
      `FloatingPanel:size-positive:${size.width}:${size.height}`,
      `${name} width and height must be greater than 0. It was ignored.`,
    );
    return null;
  }
  return size;
}

export type FloatingPanelProps = RootProps<{
  children?: ReactNode | undefined;
  /** Base for the generated ids; also the wrapper id when `as` is set. */
  id?: string | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  position?: FloatingPanelPosition | null | undefined;
  defaultPosition?: FloatingPanelPosition | null | undefined;
  onPositionChange?: ((position: FloatingPanelPosition) => void) | undefined;
  size?: FloatingPanelSize | null | undefined;
  defaultSize?: FloatingPanelSize | null | undefined;
  onSizeChange?: ((size: FloatingPanelSize) => void) | undefined;
}>;

export function FloatingPanel({
  as,
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  position: positionInput,
  defaultPosition: defaultPositionInput = null,
  onPositionChange,
  size: sizeInput,
  defaultSize: defaultSizeInput = null,
  onSizeChange,
  ...props
}: FloatingPanelProps) {
  const positionProp =
    positionInput === undefined
      ? undefined
      : validPosition(positionInput, "FloatingPanel position");
  const defaultPosition = validPosition(defaultPositionInput, "FloatingPanel defaultPosition");
  const sizeProp = sizeInput === undefined ? undefined : validSize(sizeInput, "FloatingPanel size");
  const defaultSize = validSize(defaultSizeInput, "FloatingPanel defaultSize");
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
    onChange: onOpenChange,
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
        Math.max(0, surfaceRect.left - boundaryRect.left),
        Math.max(0, boundaryRect.width - surfaceRect.width),
      ),
      y: Math.min(
        Math.max(0, surfaceRect.top - boundaryRect.top),
        Math.max(0, boundaryRect.height - surfaceRect.height),
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
    if (position || !rect) return position ?? undefined;
    const boundaryRect = boundary?.current?.getBoundingClientRect();
    if (!boundaryRect) return { x: rect.left, y: rect.top };
    return { x: rect.left - boundaryRect.left, y: rect.top - boundaryRect.top };
  };
  const constrainPosition = (nextPosition: FloatingPanelPosition) => {
    const rect = measure();
    const ownerWindow = surfaceRef.current?.ownerDocument.defaultView;
    if (!rect || !ownerWindow) return nextPosition;
    const boundaryRect = boundary?.current?.getBoundingClientRect();
    const right = boundaryRect?.width ?? ownerWindow.innerWidth;
    const bottom = boundaryRect?.height ?? ownerWindow.innerHeight;
    return {
      x: Math.min(Math.max(0, nextPosition.x), Math.max(0, right - rect.width)),
      y: Math.min(Math.max(0, nextPosition.y), Math.max(0, bottom - rect.height)),
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
    const constrainToBoundary = () => {
      const current = positionRef.current;
      const boundaryRect = boundaryElement.getBoundingClientRect();
      const surfaceRect = surfaceRef.current?.getBoundingClientRect();
      if (!current || !surfaceRect) return;
      const nextPosition = {
        x: Math.min(Math.max(0, current.x), Math.max(0, boundaryRect.width - surfaceRect.width)),
        y: Math.min(Math.max(0, current.y), Math.max(0, boundaryRect.height - surfaceRect.height)),
      };
      if (nextPosition.x === current.x && nextPosition.y === current.y) return;
      positionRef.current = nextPosition;
      setPosition(nextPosition);
    };
    ownerWindow.addEventListener("resize", constrainToBoundary);
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(constrainToBoundary);
    observer?.observe(boundaryElement);
    return () => {
      ownerWindow.removeEventListener("resize", constrainToBoundary);
      observer?.disconnect();
    };
  }, [boundary, setPosition]);

  useEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    triggerRef.current?.focus();
  }, [open]);

  const stackIndex = stack.indexOf(baseId);
  const Root = rootElement(as);
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
      <Root data-slot="floating-panel" {...props} id={id} data-open={dataAttr(open)}>
        {children}
      </Root>
    </FloatingPanelContext>
  );
}
