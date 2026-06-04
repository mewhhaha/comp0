import { useState, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";

export type WindowSplitterProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> & {
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: ((value: number) => void) | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  step?: number | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
  controls: string;
  disabled?: boolean | undefined;
};

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

export function WindowSplitter({
  value,
  defaultValue = 50,
  onChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  orientation = "vertical",
  controls,
  disabled = false,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  style,
  ...props
}: WindowSplitterProps & RefProp<HTMLDivElement>) {
  const [currentValue, setCurrentValue] = useControllableState({ value, defaultValue, onChange });
  const [dragging, setDragging] = useState(false);

  function setClamped(nextValue: number) {
    setCurrentValue(clamp(nextValue, minValue, maxValue));
  }

  function setFromPointer(event: PointerEvent<HTMLDivElement>) {
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const size = orientation === "vertical" ? rect.width : rect.height;
    if (size <= 0) return;
    const offset =
      orientation === "vertical" ? event.clientX - rect.left : event.clientY - rect.top;
    const ratio = offset / size;
    setClamped(minValue + ratio * (maxValue - minValue));
  }

  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      tabIndex={disabled ? undefined : (props.tabIndex ?? 0)}
      aria-orientation={orientation}
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-valuenow={currentValue}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      data-disabled={dataAttr(disabled)}
      data-dragging={dataAttr(dragging)}
      data-orientation={orientation}
      data-slot={dataSlot(props, "window-splitter")}
      style={{ "--splitter-value": currentValue, ...style } as CSSProperties}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "Home") {
          event.preventDefault();
          setClamped(minValue);
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          setClamped(maxValue);
          return;
        }

        const decrease = event.key === "ArrowLeft" || event.key === "ArrowUp";
        const increase = event.key === "ArrowRight" || event.key === "ArrowDown";
        if (!decrease && !increase) return;
        event.preventDefault();
        setClamped(currentValue + (increase ? step : -step));
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        setFromPointer(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (event.defaultPrevented || disabled || !dragging) return;
        setFromPointer(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
    />
  );
}
