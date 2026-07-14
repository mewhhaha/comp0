import { Radio, RadioGroup } from "@comp0/react";

const plans = [
  {
    value: "starter",
    name: "Starter",
    description: "For personal projects and prototypes.",
    price: "$0",
  },
  {
    value: "pro",
    name: "Pro",
    description: "For teams shipping multiple products.",
    price: "$12",
  },
  {
    value: "business",
    name: "Business",
    description: "For organizations that need advanced controls.",
    price: "$49",
  },
];

export function Example() {
  return (
    <RadioGroup className="m-0 w-full max-w-md border-0 p-0" defaultValue="pro" name="plan">
      <legend className="mb-3 text-base font-medium text-zinc-950 sm:text-sm dark:text-white">
        Choose a plan
      </legend>
      <div className="grid gap-3">
        {plans.map((plan) => (
          <Radio
            key={plan.value}
            value={plan.value}
            className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border border-zinc-950/10 bg-white p-4 text-left text-zinc-800 outline-2 outline-offset-2 outline-transparent transition hover:border-zinc-950/20 data-focused:outline-teal-600 data-selected:border-teal-600 data-selected:bg-teal-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-white/20 dark:data-focused:outline-teal-400 dark:data-selected:border-teal-400 dark:data-selected:bg-teal-950/40"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-zinc-950/20 bg-white group-data-selected:border-teal-600 dark:border-white/20 dark:bg-zinc-900 dark:group-data-selected:border-teal-400"
            >
              <span className="size-2 rounded-full bg-teal-600 opacity-0 group-data-selected:opacity-100 dark:bg-teal-400" />
            </span>
            <span className="grid gap-1">
              <span className="font-medium text-zinc-950 dark:text-white">{plan.name}</span>
              <span className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                {plan.description}
              </span>
            </span>
            <span className="font-medium text-zinc-950 dark:text-white">{plan.price}</span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
