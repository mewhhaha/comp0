import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { useBusy } from "../internal/busy.js";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { sourceId, useCitationsContext } from "./citation-shared.js";

export type CitationProps = ComponentProps<"a"> &
  AsProp & {
    /** The `value` of the Source this citation points at. */
    value: string;
  };

/**
 * An inline reference to a source, shown as its number (`[2]`) unless given
 * children. It links to the source in the list and is named "Source 2: Title"
 * so the number is never announced on its own. A citation to a source that is
 * not in the list renders an inert span with data-missing, or data-pending
 * while a busy region may still be filling the list.
 */
export function Citation({
  as,
  children,
  value,
  "aria-label": ariaLabel,
  ...props
}: CitationProps) {
  const warnOnce = useWarnOnce();
  const busy = useBusy();
  const { baseId, sources } = useCitationsContext("Citation");
  const position = sources.findIndex((source) => source.value === value);
  const source = sources[position];

  if (!source) {
    // The list registers in layout effects, so an empty list is the first render, not an error.
    if (sources.length > 0) {
      warnOnce(`citation:${value}`, `Citation value "${value}" does not match any Source value.`);
    }
    const Missing = partElement(undefined, "span");
    return (
      <Missing
        data-slot="citation"
        data-value={value}
        data-missing={dataAttr(!busy)}
        data-pending={dataAttr(busy)}
        aria-label="Unknown source"
      >
        {children ?? "[?]"}
      </Missing>
    );
  }

  const number = position + 1;
  const Part = partElement(as, "a");
  return (
    <Part
      data-slot="citation"
      {...props}
      href={`#${sourceId(baseId, value)}`}
      aria-label={ariaLabel ?? `Source ${number}: ${source.title}`}
      data-value={value}
      data-number={number}
    >
      {children ?? `[${number}]`}
    </Part>
  );
}
