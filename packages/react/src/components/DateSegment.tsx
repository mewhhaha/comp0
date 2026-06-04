import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import {
  DateFieldContext,
  segmentValue,
  partBounds,
  type DateSegmentPart,
} from "./date-time-shared.js";
import { type DateSegmentProps } from "./date-time-shared.js";
export type { DateSegmentProps } from "./date-time-shared.js";

const segmentLabels: Record<Exclude<DateSegmentPart, "literal">, string> = {
  year: "Year",
  month: "Month",
  day: "Day",
  hour: "Hour",
  minute: "Minute",
  second: "Second",
};

export function DateSegment({
  part = "literal",
  children,
  onKeyDown,
  ref,
  ...props
}: DateSegmentProps & RefProp<HTMLDivElement>) {
  const field = useContext(DateFieldContext);
  const value = field ? segmentValue(field.value, field.kind, part) : "";
  const numberValue = Number(value);
  const bounds = partBounds(part);

  if (part === "literal") {
    return (
      <div
        {...props}
        ref={ref}
        data-placeholder={dataAttr(!field)}
        data-slot="date-segment"
        data-type={part}
      >
        {children ?? value}
      </div>
    );
  }

  const ariaLabel = props["aria-label"] ?? segmentLabels[part];

  return (
    <InteractiveDiv
      {...props}
      ref={ref}
      role="spinbutton"
      tabIndex={props.tabIndex ?? 0}
      aria-valuemin={bounds?.min}
      aria-valuemax={bounds?.max}
      aria-valuenow={numberValue}
      aria-valuetext={value}
      aria-label={ariaLabel}
      data-placeholder={dataAttr(!field)}
      data-slot="date-segment"
      data-type={part}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !field) return;
        let delta = 0;
        if (event.key === "ArrowUp") delta = 1;
        else if (event.key === "ArrowDown") delta = -1;
        if (!delta) return;
        event.preventDefault();
        field.setPart(part, numberValue + delta);
      }}
    >
      {children ?? value}
    </InteractiveDiv>
  );
}
