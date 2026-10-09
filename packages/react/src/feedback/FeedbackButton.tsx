import { ToggleButton, type ToggleButtonProps } from "../toggle-button/ToggleButton.js";
import { type FeedbackValue } from "./Feedback.js";

export type FeedbackButtonProps = Omit<
  ToggleButtonProps,
  "value" | "command" | "commandfor" | "pending" | "selected" | "defaultSelected"
> & {
  value: FeedbackValue;
};

/** One rating. Give it a text name such as "Good response"; an icon alone has no name. */
export function FeedbackButton(props: FeedbackButtonProps) {
  return <ToggleButton data-slot="feedback-button" {...props} />;
}
