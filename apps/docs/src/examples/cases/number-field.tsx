import { Label, NumberField } from "@comp0/react";

export function Example() {
  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="tickets"
      >
        Tickets
      </Label>
      <NumberField
        className="[&_input]:w-full [&_input]:rounded [&_input]:border [&_input]:border-zinc-950/10 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-zinc-950 [&_input]:outline-teal-600 [&_input]:focus-visible:outline-2 sm:[&_input]:py-2 sm:[&_input]:text-sm dark:[&_input]:border-white/10 dark:[&_input]:bg-zinc-900 dark:[&_input]:text-zinc-50 dark:[&_input]:outline-teal-400"
        defaultValue={2}
        id="tickets"
        max={10}
        min={1}
        name="tickets"
      />
    </div>
  );
}
