import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useErrorSummaryContext } from "./error-summary-shared.js";

export type ErrorSummaryTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function ErrorSummaryTitle({
  children,
  ref,
  ...props
}: ErrorSummaryTitleProps & RefProp<HTMLHeadingElement>) {
  const summary = useErrorSummaryContext("ErrorSummaryTitle");
  return (
    <h2
      {...props}
      ref={ref}
      id={props.id ?? summary.titleId}
      data-slot={dataSlot(props, "error-summary-title")}
    >
      {children}
    </h2>
  );
}
