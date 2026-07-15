import {
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarGrid,
} from "@comp0/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

export function Example() {
  return (
    <RangeCalendar defaultValue={["2026-07-14", "2026-07-18"]}>
      <div className="mb-2 flex items-center justify-between">
        <CalendarPreviousButton className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </CalendarPreviousButton>
        <CalendarHeader className="text-sm font-semibold" />
        <CalendarNextButton className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </CalendarNextButton>
      </div>
      <RangeCalendarGrid className="text-sm">
        {(cell) => (
          <RangeCalendarCell
            date={cell.iso}
            outsideMonth={cell.outsideMonth}
            className="[&_button]:size-9 [&_button]:rounded [&_button]:data-in-range:bg-teal-50 [&_button]:data-range-end:bg-teal-600 [&_button]:data-range-end:text-white [&_button]:data-range-start:bg-teal-600 [&_button]:data-range-start:text-white dark:[&_button]:data-in-range:bg-teal-950"
          />
        )}
      </RangeCalendarGrid>
    </RangeCalendar>
  );
}
