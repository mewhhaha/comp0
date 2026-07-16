import {
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
  DateRangePicker,
  DateRangePickerEndField,
  DateRangePickerPopover,
  DateRangePickerStartField,
  DateRangePickerTrigger,
  Label,
  RangeCalendar,
  RangeCalendarGrid,
} from "@comp0/react";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

export function Example() {
  return (
    <DateRangePicker name="stay" defaultValue={["2026-07-14", "2026-07-18"]}>
      <Label className="mb-2 block text-sm font-medium">Stay dates</Label>
      <div className="flex flex-wrap items-end gap-2">
        <span className="grid w-36 gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Check-in
          <span className="overflow-hidden rounded border border-zinc-950/15 bg-white outline-teal-600 focus-within:outline-2 dark:border-white/15 dark:bg-zinc-900 dark:outline-teal-400">
            <DateRangePickerStartField
              aria-label="Check-in"
              className="w-[calc(100%+2.5rem)] border-0 bg-transparent px-2 py-2 text-sm text-zinc-950 outline-none dark:text-zinc-50 [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </span>
        </span>
        <span className="grid w-36 gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Check-out
          <span className="overflow-hidden rounded border border-zinc-950/15 bg-white outline-teal-600 focus-within:outline-2 dark:border-white/15 dark:bg-zinc-900 dark:outline-teal-400">
            <DateRangePickerEndField
              aria-label="Check-out"
              className="w-[calc(100%+2.5rem)] border-0 bg-transparent px-2 py-2 text-sm text-zinc-950 outline-none dark:text-zinc-50 [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </span>
        </span>
        <DateRangePickerTrigger className="inline-flex h-9.5 items-center justify-center rounded border border-zinc-950/15 px-2.5 text-sm outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400">
          <CalendarDaysIcon className="size-4" aria-hidden="true" />
        </DateRangePickerTrigger>
      </div>
      <DateRangePickerPopover
        placement="bottom end"
        offset={4}
        className="rounded-lg border border-zinc-950/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900"
      >
        <RangeCalendar>
          <div className="mb-2 flex items-center justify-between">
            <CalendarPreviousButton className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronLeftIcon className="size-4" aria-hidden="true" />
            </CalendarPreviousButton>
            <CalendarHeader className="text-sm font-semibold" />
            <CalendarNextButton className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            </CalendarNextButton>
          </div>
          <RangeCalendarGrid className="border-separate border-spacing-0 text-sm [&_button]:size-9 [&_button]:outline-teal-600 [&_button:focus-visible]:rounded [&_button:focus-visible]:outline-2 [&_button:hover]:rounded [&_button:hover]:bg-zinc-100 [&_td]:p-0 [&_td[data-in-range]]:bg-teal-50 [&_td[data-in-range]_button:hover]:bg-teal-200 [&_td[data-range-end]]:bg-teal-600 [&_td[data-range-end]_button]:text-white [&_td[data-range-end]_button:hover]:bg-teal-700 [&_td[data-range-preview]]:bg-teal-100 [&_td[data-range-preview]_button:hover]:bg-teal-200 [&_td[data-range-start]]:bg-teal-600 [&_td[data-range-start]_button]:text-white [&_td[data-range-start]_button:hover]:bg-teal-700 dark:[&_button]:outline-teal-400 dark:[&_button:hover]:bg-zinc-800 dark:[&_td[data-in-range]]:bg-teal-950 dark:[&_td[data-in-range]_button:hover]:bg-teal-900 dark:[&_td[data-range-end]_button:hover]:bg-teal-500 dark:[&_td[data-range-preview]]:bg-teal-900 dark:[&_td[data-range-preview]_button:hover]:bg-teal-800 dark:[&_td[data-range-start]_button:hover]:bg-teal-500" />
        </RangeCalendar>
      </DateRangePickerPopover>
    </DateRangePicker>
  );
}
