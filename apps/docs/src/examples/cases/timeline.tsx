import { Timeline, TimelineItem, TimelineTime } from "@comp0/react";

const events = [
  ["2026-07-14T09:15:00Z", "09:15", "Build completed", "All checks passed on main."],
  ["2026-07-14T09:22:00Z", "09:22", "Release created", "Version 0.1.0 was tagged."],
  ["2026-07-14T09:27:00Z", "09:27", "Deployed", "The release reached production."],
] as const;

export function Example() {
  return (
    <Timeline aria-label="Release history" className="w-full max-w-sm space-y-0">
      {events.map(([dateTime, time, title, description]) => (
        <TimelineItem
          key={dateTime}
          className="relative border-l border-zinc-950/15 pb-6 pl-6 last:pb-0 dark:border-white/15"
        >
          <span
            className="absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-white bg-teal-600 dark:border-zinc-950 dark:bg-teal-400"
            aria-hidden="true"
          />
          <TimelineTime
            dateTime={dateTime}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {time}
          </TimelineTime>
          <h3 className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
