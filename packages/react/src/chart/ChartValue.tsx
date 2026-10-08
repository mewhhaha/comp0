import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { dataAttr, getRovingFocusTarget } from "@comp0/core";
import { dataSlot } from "../internal/shared.js";
import { writingDirection } from "../internal/writing-direction.js";
import { useChartInteraction } from "./chart-interaction-context.js";
import { useChartNavigation } from "./chart-navigation.js";
import { type ChartValueDetails } from "./chart-value-details.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Each SVG group is an individually named graphic within the chart. */

export type ChartValueProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  children: ReactNode;
  details: ChartValueDetails;
  fallbackSlot: string;
};

/** The focusable, hoverable SVG group every chart mark is built on. */
export function ChartValue({
  children,
  details,
  fallbackSlot,
  id,
  onBlur,
  onFocus,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: ChartValueProps) {
  const generatedId = useId();
  const interaction = useChartInteraction("ChartValue");
  const navigation = useChartNavigation("ChartValue");
  const active = interaction.active?.key === generatedId;
  const valueId = id ?? generatedId;

  const moveFocus = (event: KeyboardEvent<SVGGElement>) => {
    const plot = event.currentTarget.ownerSVGElement;
    if (!plot) return;
    const values = [...plot.querySelectorAll<SVGGElement>("[data-chart-value]")];
    const currentIndex = values.indexOf(event.currentTarget);
    if (currentIndex === -1) return;
    const customTargetIndex = navigation.getTargetIndex?.(currentIndex, event.key);
    if (customTargetIndex !== undefined) {
      event.preventDefault();
      values[customTargetIndex]?.focus();
      return;
    }
    const targetKey = getRovingFocusTarget(
      values.map((_, index) => ({ key: String(index) })),
      String(currentIndex),
      event.key,
      {
        orientation: navigation.orientation,
        dir: writingDirection(event.currentTarget),
        loop: navigation.loop,
      },
    );
    if (targetKey === undefined) return;
    event.preventDefault();
    values[Number(targetKey)]?.focus();
  };
  let activeOverlay: ReactNode;
  if (active && navigation.overlayElement) {
    activeOverlay = createPortal(
      <g
        aria-hidden="true"
        pointerEvents="none"
        data-active=""
        data-slot={`${fallbackSlot}-active`}
      >
        <use href={`#${valueId}`} />
      </g>,
      navigation.overlayElement,
    );
  }
  return (
    <>
      <g
        {...props}
        ref={ref}
        id={valueId}
        role="img"
        tabIndex={details.index === navigation.tabStopIndex ? 0 : -1}
        aria-label={details.label}
        style={style}
        data-active={dataAttr(active)}
        data-chart-value=""
        data-slot={dataSlot(props, fallbackSlot)}
        onFocus={(event) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          navigation.setTabStopIndex(details.index);
          interaction.setFocused({ key: generatedId, details, element: event.currentTarget });
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.defaultPrevented) interaction.clearFocused(generatedId);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) moveFocus(event);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) {
            interaction.setHovered({ key: generatedId, details, element: event.currentTarget });
          }
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (!event.defaultPrevented) interaction.scheduleHoverClear(generatedId);
        }}
      >
        {children}
      </g>
      {activeOverlay}
    </>
  );
}
