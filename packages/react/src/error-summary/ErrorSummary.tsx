import { useId, useLayoutEffect, useRef, type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { ErrorSummaryContext } from "./error-summary-shared.js";

export type ErrorSummaryProps = Omit<ComponentProps<"div">, "role"> &
  AsProp & {
    /** Moves focus to the summary when it mounts; enabled by default. */
    autoFocus?: boolean | undefined;
  };

export function ErrorSummary({
  as,
  autoFocus = true,
  id,
  tabIndex,
  ref,
  ...props
}: ErrorSummaryProps) {
  const reactId = useId();
  const summaryRef = useRef<HTMLElement | null>(null);
  const composedRef = useComposedRefs(summaryRef, ref);
  const summaryId = id ?? `comp0-${reactId}`;
  const titleId = `${summaryId}-title`;

  useLayoutEffect(() => {
    if (autoFocus) summaryRef.current?.focus();
  }, [autoFocus]);

  const Part = partElement(as, "div");
  return (
    <ErrorSummaryContext value={{ titleId }}>
      <Part
        data-slot="error-summary"
        {...props}
        ref={composedRef}
        id={summaryId}
        role="alert"
        tabIndex={tabIndex ?? -1}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
      />
    </ErrorSummaryContext>
  );
}
