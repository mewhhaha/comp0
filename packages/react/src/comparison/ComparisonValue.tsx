import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";
import { useComparisonContext, useComparisonRowContext } from "./comparison-shared.js";

export type ComparisonValueProps = ComponentProps<"td"> &
  AsProp & {
    /** The `value` of the ComparisonOption this cell belongs to. */
    option: string;
    /**
     * A yes or no value. The cell gets a text alternative ("Included" or "Not
     * included") and any children become a decorative mark, hidden from
     * assistive technology.
     */
    included?: boolean | undefined;
    /** Overrides the text alternative of an `included` value. */
    label?: string | undefined;
  };

/**
 * One cell: the value of a feature for an option. It carries data-recommended
 * when its option is recommended, data-differs when the row's values are not
 * all the same, and data-included when an `included` value is true.
 */
export function ComparisonValue({
  as,
  children,
  included,
  label,
  option,
  ...props
}: ComparisonValueProps) {
  const warnOnce = useWarnOnce();
  const { options } = useComparisonContext("ComparisonValue");
  const { differs } = useComparisonRowContext("ComparisonValue");
  const match = options.find((entry) => entry.value === option);
  if (options.length > 0 && !match) {
    warnOnce(
      `comparison-option:${option}`,
      `ComparisonValue option "${option}" does not match any ComparisonOption value.`,
    );
  }

  let content = children;
  if (included !== undefined) {
    let text = "Not included";
    if (included) text = "Included";
    content = (
      <>
        <VisuallyHidden>{label ?? text}</VisuallyHidden>
        <span aria-hidden="true" data-slot="comparison-mark">
          {children}
        </span>
      </>
    );
  }

  const Part = partElement(as, "td");
  return (
    <Part
      data-slot="comparison-value"
      {...props}
      data-option={option}
      data-recommended={dataAttr(match?.recommended)}
      data-differs={dataAttr(differs)}
      data-included={dataAttr(included)}
    >
      {content}
    </Part>
  );
}
