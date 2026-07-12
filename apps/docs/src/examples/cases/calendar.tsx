import { useState } from "react";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
} from "@comp0/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";

export function Example() {
  const [date, setDate] = useState("2026-07-14");
  return (
    <Calendar
      as="div"
      className="max-w-xs rounded border border-zinc-950/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900"
      value={date}
      onChange={setDate}
      min="2026-01-01"
      max="2026-12-31"
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <CalendarPreviousButton className="inline-flex size-8 items-center justify-center rounded text-zinc-700 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 disabled:opacity-40 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-zinc-800">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </CalendarPreviousButton>
        <CalendarHeader className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100" />
        <CalendarNextButton className="inline-flex size-8 items-center justify-center rounded text-zinc-700 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 disabled:opacity-40 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-zinc-800">
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </CalendarNextButton>
      </div>
      <CalendarGrid className="w-full border-separate border-spacing-0.5 [&_th]:pb-1 [&_th]:text-sm [&_th]:font-normal [&_th]:text-zinc-500 dark:[&_th]:text-zinc-400">
        {(cell) => (
          <CalendarCell
            date={cell.iso}
            outsideMonth={cell.outsideMonth}
            className="p-0 text-center [&>button]:size-9 [&>button]:rounded [&>button]:text-base [&>button]:text-zinc-800 [&>button]:outline-teal-600 [&>button]:hover:bg-zinc-100 [&>button]:focus-visible:outline-2 [&>button]:disabled:opacity-40 [&>button[data-outside-month]]:text-zinc-400 [&>button[data-selected]]:bg-teal-600 [&>button[data-selected]]:text-white [&>button[data-today]]:font-semibold sm:[&>button]:text-sm dark:[&>button]:text-zinc-100 dark:[&>button]:outline-teal-400 dark:[&>button]:hover:bg-zinc-800 dark:[&>button[data-outside-month]]:text-zinc-600 dark:[&>button[data-selected]]:bg-teal-500 dark:[&>button[data-selected]]:text-zinc-950"
          />
        )}
      </CalendarGrid>
      <p className="pt-2 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {date}</p>
    </Calendar>
  );
}
