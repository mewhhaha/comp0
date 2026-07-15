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
        <span className="grid gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Check-in
          <DateRangePickerStartField
            aria-label="Check-in"
            className="rounded border border-zinc-950/15 bg-transparent px-2 py-2 text-sm dark:border-white/15"
          />
        </span>
        <span className="grid gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Check-out
          <DateRangePickerEndField
            aria-label="Check-out"
            className="rounded border border-zinc-950/15 bg-transparent px-2 py-2 text-sm dark:border-white/15"
          />
        </span>
        <DateRangePickerTrigger className="grid size-9 place-items-center rounded border border-zinc-950/15 dark:border-white/15">
          <CalendarDaysIcon className="size-4" aria-hidden="true" />
        </DateRangePickerTrigger>
      </div>
      <DateRangePickerPopover className="rounded-lg border border-zinc-950/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-900">
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
          <RangeCalendarGrid className="text-sm [&_button]:size-9 [&_button]:rounded [&_button]:data-in-range:bg-teal-50 [&_button]:data-range-end:bg-teal-600 [&_button]:data-range-end:text-white [&_button]:data-range-start:bg-teal-600 [&_button]:data-range-start:text-white dark:[&_button]:data-in-range:bg-teal-950" />
        </RangeCalendar>
      </DateRangePickerPopover>
    </DateRangePicker>
  );
}
