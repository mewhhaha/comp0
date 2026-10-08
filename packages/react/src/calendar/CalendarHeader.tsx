import { type ComponentProps, type ReactNode } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { monthStartDate, useCalendarContext } from "./calendar-shared.js";

export type CalendarHeaderProps = Omit<ComponentProps<"div">, "children"> &
  AsProp & {
    /** Custom content; a function receives the localized month-and-year label. */
    children?: ReactNode | ((label: string) => ReactNode) | undefined;
  };

export function CalendarHeader({ as, children, id, ...props }: CalendarHeaderProps) {
  const calendar = useCalendarContext("CalendarHeader");
  const label = new Intl.DateTimeFormat(calendar.locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStartDate(calendar.visibleMonth));
  let content: ReactNode;
  if (typeof children === "function") content = children(label);
  else content = children ?? label;

  const Part = partElement(as, "div");
  return (
    <Part data-slot="calendar-header" {...props} id={id ?? calendar.headerId} aria-live="polite">
      {content}
    </Part>
  );
}
