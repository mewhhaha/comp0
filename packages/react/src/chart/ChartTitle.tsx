import { useEffect, useRef, type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useChartMeta } from "./chart-meta.js";

export type ChartTitleProps = ComponentProps<"figcaption"> & AsProp;

export function ChartTitle({ as, ref, ...props }: ChartTitleProps) {
  const { setTitle } = useChartMeta("ChartTitle");
  const titleRef = useRef<HTMLElement | null>(null);
  const composedRef = useComposedRefs(titleRef, ref);
  // Re-reads the rendered text after every commit so the default ChartTable caption follows it.
  useEffect(() => {
    setTitle(titleRef.current?.textContent?.trim() || null);
  });
  useEffect(() => () => setTitle(null), [setTitle]);
  const Part = partElement(as, "figcaption");
  return <Part data-slot="chart-title" {...props} ref={composedRef} />;
}
