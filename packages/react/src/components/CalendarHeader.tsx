import { type HTMLAttributes, type ReactNode } from "react";
import { type RefProp } from "../shared.js";
import { monthStartDate, useCalendarContext } from "./calendar-shared.js";

export type CalendarHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Custom content; a function receives the localized month-and-year label. */
  children?: ReactNode | ((label: string) => ReactNode) | undefined;
};

export function CalendarHeader({
  children,
  id,
  ref,
  ...props
}: CalendarHeaderProps & RefProp<HTMLDivElement>) {
  const calendar = useCalendarContext();
  if (!calendar) throw new Error("CalendarHeader must be rendered inside Calendar.");
  const label = new Intl.DateTimeFormat(calendar.locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStartDate(calendar.visibleMonth));
  let content: ReactNode;
  if (typeof children === "function") content = children(label);
  else content = children ?? label;

  return (
    <div {...props} ref={ref} id={id ?? calendar.headerId} aria-live="polite">
      {content}
    </div>
  );
}
