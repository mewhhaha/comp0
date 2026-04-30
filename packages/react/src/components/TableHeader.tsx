import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

export function TableHeader(props: TableHeaderProps & RefProp<HTMLTableSectionElement>) {
  const { ref } = props;
  return <thead {...props} ref={ref} />;
}
