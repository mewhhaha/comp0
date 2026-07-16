import { useState } from "react";
import { Button, Steps, StepsItem, StepsList, StepsPanel, StepsTrigger } from "@comp0/react";
import { CheckIcon } from "@heroicons/react/16/solid";

const checkout = [
  { value: "shipping", title: "Shipping" },
  { value: "payment", title: "Payment" },
  { value: "review", title: "Review" },
];

export function Example() {
  const [current, setCurrent] = useState("shipping");
  const position = checkout.findIndex((entry) => entry.value === current);
  const previous = checkout[position - 1];
  const next = checkout[position + 1];

  return (
    <Steps as="div" className="w-full max-w-md" value={current} onChange={setCurrent}>
      <StepsList aria-label="Checkout" className="flex items-center gap-3">
        {checkout.map((entry) => (
          <StepsItem
            key={entry.value}
            value={entry.value}
            className="group flex items-center gap-3 not-last:flex-1 not-last:after:h-px not-last:after:flex-1 not-last:after:bg-zinc-950/10 dark:not-last:after:bg-white/10"
          >
            {({ step }) => (
              <StepsTrigger className="flex items-center gap-2 text-base text-zinc-500 data-completed:text-zinc-700 data-current:text-zinc-950 sm:text-sm dark:text-zinc-400 dark:data-completed:text-zinc-300 dark:data-current:text-white">
                <span className="grid size-6 place-items-center rounded-full border border-zinc-950/20 text-xs group-data-completed:border-teal-700 group-data-completed:bg-teal-700 group-data-completed:text-white group-data-current:border-teal-700 group-data-current:text-teal-700 dark:border-white/20 dark:group-data-completed:border-teal-400 dark:group-data-completed:bg-teal-400 dark:group-data-completed:text-zinc-950 dark:group-data-current:border-teal-400 dark:group-data-current:text-teal-300">
                  <CheckIcon
                    className="hidden size-4 group-data-completed:block"
                    aria-hidden="true"
                  />
                  <span className="group-data-completed:hidden">{step}</span>
                </span>
                {entry.title}
              </StepsTrigger>
            )}
          </StepsItem>
        ))}
      </StepsList>
      <StepsPanel
        className="pt-4 text-base text-zinc-600 sm:text-sm dark:text-zinc-400"
        value="shipping"
      >
        Where should we send your order?
      </StepsPanel>
      <StepsPanel
        className="pt-4 text-base text-zinc-600 sm:text-sm dark:text-zinc-400"
        value="payment"
      >
        How would you like to pay?
      </StepsPanel>
      <StepsPanel
        className="pt-4 text-base text-zinc-600 sm:text-sm dark:text-zinc-400"
        value="review"
      >
        Check everything before placing the order.
      </StepsPanel>
      <div className="flex gap-2 pt-4">
        <Button
          className="rounded px-3 py-2.5 text-base text-zinc-700 ring-1 ring-zinc-950/10 disabled:opacity-40 sm:py-2 sm:text-sm dark:text-zinc-300 dark:ring-white/10"
          disabled={!previous}
          onClick={() => previous && setCurrent(previous.value)}
        >
          Back
        </Button>
        <Button
          className="rounded bg-teal-700 px-3 py-2.5 text-base text-white disabled:opacity-40 sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
          disabled={!next}
          onClick={() => next && setCurrent(next.value)}
        >
          Continue
        </Button>
      </div>
    </Steps>
  );
}
