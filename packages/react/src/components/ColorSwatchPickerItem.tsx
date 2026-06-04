import { type RefProp } from "../shared.js";
import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { ColorSwatch } from "./ColorSwatch.js";
import { ColorSwatchPickerContext } from "./ColorSwatchPicker.js";
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
  const picker = useContext(ColorSwatchPickerContext);
  const register = picker?.register;
  const key = color.toLocaleLowerCase();
  const selected = context?.value.toLocaleLowerCase() === key;
  const active = picker?.activeKey === key;
  const resolvedDisabled = Boolean(disabled);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (!picker || active) tabIndex = props.tabIndex ?? 0;

  const itemRef = useCallback(
    (element: HTMLDivElement | null) => {
      register?.(key, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [key, ref, register, resolvedDisabled],
  );

  return (
    <div
      {...props}
      ref={itemRef}
      role="option"
      tabIndex={tabIndex}
      aria-disabled={resolvedDisabled || undefined}
      aria-selected={selected || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-focused={dataAttr(active)}
      data-selected={dataAttr(selected)}
      data-slot="color-swatch-picker-item"
      data-value={color}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) {
          picker?.setActiveKey(key);
          context?.setValue(color);
        }
      }}
      onKeyDown={(event) => {
        if (resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        picker?.setActiveKey(key);
        context?.setValue(color);
      }}
    >
      {children ?? <ColorSwatch color={color} />}
    </div>
  );
}
