import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

export function TableCaption(props: TableCaptionProps & RefProp<HTMLTableCaptionElement>) {
  const { ref } = props;
  return <caption {...props} ref={ref} />;
}
