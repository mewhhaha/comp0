import { useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { useComposedRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { ErrorSummaryContext } from "./error-summary-shared.js";

export type ErrorSummaryProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Moves focus to the summary when it mounts; enabled by default. */
  autoFocus?: boolean | undefined;
};

export function ErrorSummary({
  autoFocus = true,
  children,
  id,
  tabIndex,
  ref,
  ...props
}: ErrorSummaryProps & RefProp<HTMLDivElement>) {
  const reactId = useId();
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(summaryRef, ref);
  const summaryId = id ?? `comp0-${reactId}`;
  const titleId = `${summaryId}-title`;

  useLayoutEffect(() => {
    if (autoFocus) summaryRef.current?.focus();
  }, [autoFocus]);

  return (
    <ErrorSummaryContext value={{ titleId }}>
      <div
        {...props}
        ref={composedRef}
        id={summaryId}
        role="alert"
        tabIndex={tabIndex ?? -1}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
        data-slot={dataSlot(props, "error-summary")}
      >
        {children}
      </div>
    </ErrorSummaryContext>
  );
}
