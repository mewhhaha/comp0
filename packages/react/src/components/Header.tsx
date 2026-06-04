import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
export function Header(props: HTMLAttributes<HTMLElement> & RefProp<HTMLElement>) {
  const { ref } = props;
  return <header {...props} ref={ref} data-slot="header" />;
}
