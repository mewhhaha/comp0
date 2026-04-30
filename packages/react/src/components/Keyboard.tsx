import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
export function Keyboard(props: HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  const { ref } = props;
  return <kbd {...props} ref={ref} data-slot="keyboard" />;
}
