import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
export function ColorThumb(props: HTMLAttributes<HTMLDivElement> & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return <div {...props} ref={ref} data-slot="color-thumb" />;
}
