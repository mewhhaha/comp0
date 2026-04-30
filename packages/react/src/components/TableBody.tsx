import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableBody(props: TableBodyProps & RefProp<HTMLTableSectionElement>) {
  const { ref } = props;
  return <tbody {...props} ref={ref} />;
}
