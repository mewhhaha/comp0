import { useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { ComparisonRowContext } from "./comparison-shared.js";

function rowDiffers(row: HTMLElement) {
  const values = [...row.querySelectorAll("[data-slot='comparison-value']")].map(
    (cell) => cell.textContent?.trim() ?? "",
  );
  return new Set(values).size > 1;
}

export type ComparisonRowProps = ComponentProps<"tr"> & AsProp;

/**
 * One row of the table: the option headers in the header, or a feature and its
 * values in the body. A row whose values are not all the same carries
 * data-differs, which its values share, so consumers can highlight what sets
 * the options apart.
 */
export function ComparisonRow({ as, ref, ...props }: ComparisonRowProps) {
  const [element, setElement] = useState<HTMLTableRowElement | null>(null);
  const [differs, setDiffers] = useState(false);

  useLayoutEffect(() => {
    if (!element) return;
    const sync = () => {
      setDiffers(rowDiffers(element));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [element]);

  const Part = partElement(as, "tr");
  return (
    <ComparisonRowContext value={{ differs }}>
      <Part
        data-slot="comparison-row"
        {...props}
        ref={composeRefs(ref, setElement)}
        data-differs={dataAttr(differs)}
      />
    </ComparisonRowContext>
  );
}
