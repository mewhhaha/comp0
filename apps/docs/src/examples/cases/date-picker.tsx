import { Label, Popover } from "@comp0/react";
import {
  Calendar,
  CalendarGrid,
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
  DateField,
  DatePicker,
  DatePickerPopover,
  DatePickerTrigger,
} from "@comp0/react";

export function Example() {
  return (
    <DatePicker as="div" className="flex max-w-xs flex-col gap-1.5" defaultValue="2026-07-14">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Reservation date
      </Label>
      <Popover>
        <div className="flex gap-1.5">
          <DateField className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400" />
          <DatePickerTrigger className="rounded border border-zinc-950/10 bg-white px-3 text-base text-zinc-700 outline-teal-600 focus-visible:outline-2 data-open:bg-zinc-100 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:outline-teal-400 dark:data-open:bg-zinc-800">
            ▦
          </DatePickerTrigger>
        </div>
        <DatePickerPopover
          placement="bottom end"
          offset={4}
          className="rounded border-0 bg-white p-3 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
        >
          <Calendar>
            <div className="flex items-center justify-between gap-2 pb-2">
              <CalendarPreviousButton className="size-8 rounded text-zinc-700 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-zinc-800" />
              <CalendarHeader className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100" />
              <CalendarNextButton className="size-8 rounded text-zinc-700 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-zinc-800" />
            </div>
            <CalendarGrid className="border-separate border-spacing-0.5 [&_td]:p-0 [&_td]:text-center [&_td_button]:size-9 [&_td_button]:rounded [&_td_button]:text-base [&_td_button]:text-zinc-800 [&_td_button]:outline-teal-600 [&_td_button]:hover:bg-zinc-100 [&_td_button]:focus-visible:outline-2 [&_td_button[data-outside-month]]:text-zinc-400 [&_td_button[data-selected]]:bg-teal-600 [&_td_button[data-selected]]:text-white sm:[&_td_button]:text-sm dark:[&_td_button]:text-zinc-100 dark:[&_td_button]:outline-teal-400 dark:[&_td_button]:hover:bg-zinc-800 dark:[&_td_button[data-outside-month]]:text-zinc-600 dark:[&_td_button[data-selected]]:bg-teal-500 dark:[&_td_button[data-selected]]:text-zinc-950 [&_th]:pb-1 [&_th]:text-sm [&_th]:font-normal [&_th]:text-zinc-500 dark:[&_th]:text-zinc-400" />
          </Calendar>
        </DatePickerPopover>
      </Popover>
    </DatePicker>
  );
}
