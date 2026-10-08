import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { composeRefs, dataAttr, useCollectionNavigation } from "@comp0/core";
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

  const navigate = useCollectionNavigation();
  const { collection } = navigation;

  const moveFocus = (event: KeyboardEvent<SVGGElement>) => {
    const items = collection.items();
    const currentIndex = items.findIndex((item) => item.key === generatedId);
    if (currentIndex === -1) return;
    const customTargetIndex = navigation.getTargetIndex?.(currentIndex, event.key);
    if (customTargetIndex !== undefined) {
      event.preventDefault();
      items[customTargetIndex]?.element?.focus();
      return;
    }
    const targetKey = navigate(event.key, items, generatedId, {
      orientation: navigation.orientation,
      dir: writingDirection(event.currentTarget),
      loop: navigation.loop,
      typeahead: false,
    });
    if (targetKey === undefined) return;
    event.preventDefault();
    collection.get(targetKey)?.element?.focus();
  };
  const markRef = (element: SVGGElement | null) => {
    collection.register({
      key: generatedId,
      id: valueId,
      textValue: details.label,
      element,
    });
    composeRefs(ref)(element);
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
        data-slot={fallbackSlot}
        {...props}
        ref={markRef}
        id={valueId}
        role="img"
        tabIndex={details.index === navigation.tabStopIndex ? 0 : -1}
        aria-label={details.label}
        style={style}
        data-active={dataAttr(active)}
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
