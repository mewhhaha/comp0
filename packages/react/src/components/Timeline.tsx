import { type OlHTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TimelineProps = OlHTMLAttributes<HTMLOListElement>;

/** A chronological sequence rendered as a native ordered list. */
export function Timeline(props: TimelineProps & RefProp<HTMLOListElement>) {
  const { ref } = props;
  return <ol {...props} ref={ref} />;
}
