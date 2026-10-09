import { useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs, useCollection } from "@comp0/core";
import { useBusy } from "../internal/busy.js";
import { warnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { ComparisonContext, type ComparisonOptionItem } from "./comparison-shared.js";

type OptionSummary = { value: string; recommended: boolean };

export type ComparisonProps = ComponentProps<"table"> & AsProp;

/**
 * A native table that sets options side by side: each option is a column
 * header, each feature a row header, so assistive technology announces both
 * for every value. Name it with a native caption child, `aria-label`, or
 * `aria-labelledby`.
 */
export function Comparison({ as, ref, ...props }: ComparisonProps) {
  const busy = useBusy();
  const collection = useCollection<ComparisonOptionItem>();
  const [options, setOptions] = useState<OptionSummary[]>([]);
  const [element, setElement] = useState<HTMLTableElement | null>(null);

  // Options register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncOptions = () => {
      setOptions((previous) => {
        const next = collection
          .items()
          .map((item) => ({ value: item.key, recommended: item.recommended }));
        if (
          next.length === previous.length &&
          next.every(
            (entry, index) =>
              entry.value === previous[index]?.value &&
              entry.recommended === previous[index]?.recommended,
          )
        ) {
          return previous;
        }
        return next;
      });
    };
    syncOptions();
    return collection.subscribe(syncOptions);
  }, [collection]);

  useLayoutEffect(() => {
    if (!element || busy) return;
    const named =
      element.hasAttribute("aria-label") ||
      element.hasAttribute("aria-labelledby") ||
      element.querySelector(":scope > caption");
    if (!named) {
      warnOnce(
        "comparison-name",
        "Comparison needs an accessible name: add a caption child, aria-label, or aria-labelledby.",
      );
    }
  }, [element, busy]);

  const Part = partElement(as, "table");
  return (
    <ComparisonContext value={{ options, collection }}>
      <Part data-slot="comparison" {...props} ref={composeRefs(ref, setElement)} />
    </ComparisonContext>
  );
}
