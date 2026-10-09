import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid";
import {
  Comparison,
  ComparisonBody,
  ComparisonFeature,
  ComparisonHeader,
  ComparisonOption,
  ComparisonRow,
  ComparisonValue,
  VisuallyHidden,
} from "@comp0/react";

const plans = [
  { value: "free", title: "Free", projects: "3", support: false, sso: false },
  { value: "team", title: "Team", projects: "Unlimited", support: true, sso: false },
  { value: "business", title: "Business", projects: "Unlimited", support: true, sso: true },
];

function Mark({ on }: { on: boolean }) {
  if (on) return <CheckIcon className="size-4 text-teal-700 dark:text-teal-300" />;
  return <MinusIcon className="size-4 text-zinc-400" />;
}

export function Example() {
  return (
    <div className="max-w-full overflow-x-auto">
      <Comparison
        aria-label="Plans compared"
        className="w-full max-w-xl border-collapse text-left text-base sm:text-sm"
      >
        <ComparisonHeader>
          <tr>
            <th scope="col">
              <VisuallyHidden>Feature</VisuallyHidden>
            </th>
            {plans.map((plan) => (
              <ComparisonOption
                key={plan.value}
                value={plan.value}
                recommended={plan.value === "team"}
                className="px-3 py-2 font-semibold text-zinc-950 data-recommended:text-teal-700 dark:text-white dark:data-recommended:text-teal-300"
              >
                {plan.title}
              </ComparisonOption>
            ))}
          </tr>
        </ComparisonHeader>
        <ComparisonBody>
          <ComparisonRow className="border-t border-zinc-950/10 dark:border-white/10">
            <ComparisonFeature className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
              Projects
            </ComparisonFeature>
            {plans.map((plan) => (
              <ComparisonValue
                key={plan.value}
                option={plan.value}
                className="px-3 py-2 text-zinc-600 data-recommended:bg-teal-50 data-recommended:text-zinc-950 dark:text-zinc-400 dark:data-recommended:bg-teal-400/10 dark:data-recommended:text-white"
              >
                {plan.projects}
              </ComparisonValue>
            ))}
          </ComparisonRow>
          <ComparisonRow className="border-t border-zinc-950/10 dark:border-white/10">
            <ComparisonFeature className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
              Priority support
            </ComparisonFeature>
            {plans.map((plan) => (
              <ComparisonValue
                key={plan.value}
                option={plan.value}
                included={plan.support}
                className="px-3 py-2 text-zinc-600 data-recommended:bg-teal-50 dark:text-zinc-400 dark:data-recommended:bg-teal-400/10"
              >
                <Mark on={plan.support} />
              </ComparisonValue>
            ))}
          </ComparisonRow>
          <ComparisonRow className="border-t border-zinc-950/10 dark:border-white/10">
            <ComparisonFeature className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">
              Single sign-on
            </ComparisonFeature>
            {plans.map((plan) => (
              <ComparisonValue
                key={plan.value}
                option={plan.value}
                included={plan.sso}
                className="px-3 py-2 text-zinc-600 data-recommended:bg-teal-50 dark:text-zinc-400 dark:data-recommended:bg-teal-400/10"
              >
                <Mark on={plan.sso} />
              </ComparisonValue>
            ))}
          </ComparisonRow>
        </ComparisonBody>
      </Comparison>
    </div>
  );
}
