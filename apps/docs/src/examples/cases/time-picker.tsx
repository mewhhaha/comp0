import { useState } from "react";
import {
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  PopoverOverlay,
  PopoverTrigger,
  TimeField,
} from "@comp0/react";
import { ClockIcon } from "@heroicons/react/16/solid";

const times = [
  ["09:00", "9:00 AM"],
  ["09:30", "9:30 AM"],
  ["10:00", "10:00 AM"],
  ["10:30", "10:30 AM"],
  ["11:00", "11:00 AM"],
] as const;

export function Example() {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("09:00");

  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="meeting-time"
      >
        Meeting time
      </Label>
      <div className="flex gap-1.5">
        <TimeField
          id="meeting-time"
          name="meetingTime"
          value={time}
          onChange={(event) => setTime(event.currentTarget.value)}
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        />
        <Popover open={open} onToggle={setOpen}>
          <PopoverTrigger
            aria-label="Choose time"
            className="rounded border border-zinc-950/10 bg-white px-3 text-zinc-700 outline-teal-600 focus-visible:outline-2 data-open:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:outline-teal-400 dark:data-open:bg-zinc-800"
          >
            <ClockIcon className="size-4" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverOverlay
            aria-label="Available times"
            placement="bottom end"
            offset={4}
            className="w-40 rounded border-0 bg-white p-1 opacity-100 shadow-lg ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
          >
            <ListBox
              aria-label="Available times"
              className="grid gap-1"
              value={time}
              onChange={(nextTime) => {
                setTime(nextTime);
                setOpen(false);
              }}
            >
              {times.map(([value, label]) => (
                <ListBoxItem
                  key={value}
                  value={value}
                  className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 focus-visible:bg-teal-200 data-selected:focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50 dark:focus-visible:bg-teal-800 dark:data-selected:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
                >
                  {label}
                </ListBoxItem>
              ))}
            </ListBox>
          </PopoverOverlay>
        </Popover>
      </div>
    </div>
  );
}
