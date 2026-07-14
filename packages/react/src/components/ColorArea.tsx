import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
} from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ColorAreaContext, useColorPickerContext } from "./color-picker-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type ColorAreaProps = HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean | undefined;
};

export function ColorArea({
  children,
  disabled,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  style,
  ...props
}: ColorAreaProps & RefProp<HTMLDivElement>) {
  const colorPicker = useColorPickerContext("ColorArea");
  const xInputRef = useRef<HTMLInputElement>(null);
  const [activePointer, setActivePointer] = useState<number | null>(null);
  const resolvedDisabled = Boolean(disabled || colorPicker.disabled);
  const { color } = colorPicker;
  let areaLabel = props["aria-label"];
  if (areaLabel === undefined && props["aria-labelledby"] === undefined) {
    areaLabel = "Color";
  }
  const saturationValueText = `Saturation: ${Math.round(color.saturation)}%, brightness: ${Math.round(color.brightness)}%`;
  const brightnessValueText = `Brightness: ${Math.round(color.brightness)}%, saturation: ${Math.round(color.saturation)}%`;
  const setColorFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    let horizontalPosition = (event.clientX - rect.left) / rect.width;
    if (getComputedStyle(event.currentTarget).direction === "rtl") {
      horizontalPosition = 1 - horizontalPosition;
    }
    colorPicker.setColor({
      ...color,
      saturation: Math.min(100, Math.max(0, horizontalPosition * 100)),
      brightness: Math.min(100, Math.max(0, (1 - (event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  return (
    <ColorAreaContext value={{ color, disabled: resolvedDisabled, xInputRef }}>
      <div
        {...props}
        ref={ref}
        role={props.role ?? "group"}
        aria-label={areaLabel}
        data-dragging={dataAttr(activePointer !== null)}
        data-disabled={dataAttr(resolvedDisabled)}
        data-value={colorPicker.value}
        style={
          {
            touchAction: "none",
            ...style,
            "--comp0-color-area-saturation": `${color.saturation / 100}`,
            "--comp0-color-area-brightness": `${color.brightness / 100}`,
            "--comp0-color-area-hue": `${color.hue}`,
            "--comp0-color-area-color": colorPicker.value,
          } as CSSProperties
        }
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || resolvedDisabled || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setActivePointer(event.pointerId);
          setColorFromPointer(event);
          xInputRef.current?.focus();
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (event.defaultPrevented || resolvedDisabled || activePointer !== event.pointerId)
            return;
          setColorFromPointer(event);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          if (activePointer !== event.pointerId) return;
          event.currentTarget.releasePointerCapture?.(event.pointerId);
          setActivePointer(null);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          if (activePointer === event.pointerId) setActivePointer(null);
        }}
      >
        {children}
        <input
          ref={xInputRef}
          type="range"
          min={0}
          max={100}
          step={1}
          value={color.saturation}
          disabled={resolvedDisabled}
          aria-label={areaLabel ? `${areaLabel}, saturation` : undefined}
          aria-labelledby={props["aria-labelledby"]}
          aria-orientation="horizontal"
          aria-roledescription="2D slider"
          aria-valuetext={saturationValueText}
          data-color-area-input="saturation"
          style={visuallyHiddenStyle}
          onChange={(event) => {
            colorPicker.setColor({ ...color, saturation: event.currentTarget.valueAsNumber });
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={color.brightness}
          disabled={resolvedDisabled}
          aria-label={areaLabel ? `${areaLabel}, brightness` : undefined}
          aria-labelledby={props["aria-labelledby"]}
          aria-orientation="vertical"
          aria-roledescription="2D slider"
          aria-valuetext={brightnessValueText}
          data-color-area-input="brightness"
          style={visuallyHiddenStyle}
          onChange={(event) => {
            colorPicker.setColor({ ...color, brightness: event.currentTarget.valueAsNumber });
          }}
        />
      </div>
    </ColorAreaContext>
  );
}
