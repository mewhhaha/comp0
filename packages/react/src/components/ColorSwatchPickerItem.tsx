import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { ColorSwatch } from "./ColorSwatch.js";
import { ColorContext } from "./color-shared.js";
import { type ColorSwatchPickerItemProps } from "./color-shared.js";
export type { ColorSwatchPickerItemProps } from "./color-shared.js";
export function ColorSwatchPickerItem({
  color = "#000000",
  disabled,
  onClick,
  children,
  ref,
  ...props
}: ColorSwatchPickerItemProps & RefProp<HTMLDivElement>) {
  const context = useContext(ColorContext);
  const selected = context?.value.toLocaleLowerCase() === color.toLocaleLowerCase();
  return (
    <div
      {...props}
      ref={ref}
      role="option"
      tabIndex={disabled ? undefined : (props.tabIndex ?? 0)}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      data-disabled={dataAttr(disabled)}
      data-selected={dataAttr(selected)}
      data-slot="color-swatch-picker-item"
      data-value={color}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) context?.setValue(color);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!disabled) context?.setValue(color);
      }}
    >
      {children ?? <ColorSwatch color={color} />}
    </div>
  );
}
