import { type RefProp } from "../shared.js";
import { type TableHTMLAttributes } from "react";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

export function Table(props: TableProps & RefProp<HTMLTableElement>) {
  const { ref } = props;
  return <table {...props} ref={ref} />;
}
