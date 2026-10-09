import { DisclosureTrigger, type DisclosureTriggerProps } from "../disclosure/DisclosureTrigger.js";

export type ReasoningSummaryProps = DisclosureTriggerProps;

/** The always-visible `<summary>` that toggles the reasoning. Its text states the current phase. */
export function ReasoningSummary(props: ReasoningSummaryProps) {
  return <DisclosureTrigger data-slot="reasoning-summary" {...props} />;
}
