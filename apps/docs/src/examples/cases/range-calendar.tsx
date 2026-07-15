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
      <RangeCalendarGrid className="border-separate border-spacing-0 text-sm [&_button]:size-9 [&_button]:outline-teal-600 [&_button:focus-visible]:rounded [&_button:focus-visible]:outline-2 [&_button:hover]:rounded [&_button:hover]:bg-zinc-100 [&_td]:p-0 [&_td[data-in-range]]:bg-teal-50 [&_td[data-range-end]]:bg-teal-600 [&_td[data-range-end]_button]:text-white [&_td[data-range-preview]]:bg-teal-100 [&_td[data-range-start]]:bg-teal-600 [&_td[data-range-start]_button]:text-white dark:[&_button]:outline-teal-400 dark:[&_button:hover]:bg-zinc-800 dark:[&_td[data-in-range]]:bg-teal-950 dark:[&_td[data-range-preview]]:bg-teal-900">
        {(cell) => <RangeCalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />}
      </RangeCalendarGrid>
    </RangeCalendar>
  );
}
