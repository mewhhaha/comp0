import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableBody(props: TableBodyProps & RefProp<HTMLTableSectionElement>) {
  const { ref } = props;
  return <tbody {...props} ref={ref} />;
}
