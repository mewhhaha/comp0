import { dataAttr } from "@comp0/core";
import { BusyContext, useBusy } from "../internal/busy.js";
import { Disclosure, type DisclosureProps } from "../disclosure/Disclosure.js";

export type ReasoningProps = DisclosureProps & {
  /** True while the model is still thinking: the section is `aria-busy` and its content is busy for nested parts. */
  busy?: boolean | undefined;
};

/**
 * A collapsed-by-default disclosure for a model's reasoning or tool activity.
 * It renders a native `<details>`, so it needs no focus handling: it never
 * opens or takes focus on its own while the model is thinking. Put the status
 * text ("Thinking…", then "Thought for 4 seconds") in ReasoningSummary.
 */
export function Reasoning({ busy, ...props }: ReasoningProps) {
  const parentBusy = useBusy();
  const resolvedBusy = Boolean(busy) || parentBusy;

  return (
    <BusyContext value={resolvedBusy}>
      <Disclosure
        data-slot="reasoning"
        {...props}
        aria-busy={Boolean(busy) || undefined}
        data-busy={dataAttr(resolvedBusy)}
      />
    </BusyContext>
  );
}
