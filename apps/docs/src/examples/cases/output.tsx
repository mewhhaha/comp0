import { useState } from "react";
import { Label, Output, Slider } from "@comp0/react";

export function Example() {
  const [seats, setSeats] = useState(5);

  return (
    <form className="flex max-w-xs flex-col gap-3">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="seats"
      >
        Seats
      </Label>
      <Slider
        className="w-full accent-teal-600 dark:accent-teal-400"
        id="seats"
        min={1}
        max={20}
        name="seats"
        value={seats}
        onChange={setSeats}
      />
      <p className="flex items-baseline justify-between text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        <span>{seats} seats at $12 each</span>
        <Output
          className="text-lg font-semibold text-zinc-950 tabular-nums dark:text-white"
          htmlFor="seats"
          name="total"
        >
          ${seats * 12}/mo
        </Output>
      </p>
    </form>
  );
}
