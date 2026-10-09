import { DisclosurePanel, type DisclosurePanelProps } from "../disclosure/DisclosurePanel.js";

export type ReasoningContentProps = DisclosurePanelProps;

/** The revealed reasoning or tool activity. */
export function ReasoningContent(props: ReasoningContentProps) {
  return <DisclosurePanel data-slot="reasoning-content" {...props} />;
}
