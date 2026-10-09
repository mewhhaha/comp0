import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { BusyContext, useBusyRegion } from "../internal/busy.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type BusyRegionProps = ComponentProps<"div"> &
  AsProp & {
    /** Marks the content as still being assembled, such as a streamed answer. */
    busy?: boolean | undefined;
  };

/**
 * Wraps content that arrives progressively. While busy it sets `aria-busy`, so
 * assistive technology waits for the finished content, and comp0 parts inside
 * hold back data warnings and focus moves until it settles. Busy regions nest:
 * a part is busy while any ancestor region is.
 *
 * The region adds no live region and announces nothing when it settles; pair it
 * with a `Status` or a `role="log"` element when completion should be spoken.
 * While busy, surfaces and autofocus effects that open on their own leave focus
 * alone; a surface the user opens still takes focus as usual.
 */
export function BusyRegion({ as, busy, ...props }: BusyRegionProps) {
  const resolvedBusy = useBusyRegion(busy);

  const Part = partElement(as, "div");
  return (
    <BusyContext value={resolvedBusy}>
      <Part
        data-slot="busy-region"
        {...props}
        aria-busy={Boolean(busy) || undefined}
        data-busy={dataAttr(resolvedBusy)}
      />
    </BusyContext>
  );
}
