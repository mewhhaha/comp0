import { useLayoutEffect, useState, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";
import { useComparisonContext } from "./comparison-shared.js";

export type ComparisonOptionProps = Omit<ComponentProps<"th">, "scope"> &
  AsProp & {
    /** Identity that pairs this column with its ComparisonValue cells. */
    value: string;
    /** Marks the option as the suggested choice, for assistive technology and styling. */
    recommended?: boolean | undefined;
    /** The text announced after the option's name when it is recommended. */
    recommendedLabel?: string | undefined;
  };

/**
 * A column header naming one option. A recommended option announces its
 * recommendation as hidden text after its name and carries data-recommended,
 * which its value cells share.
 */
export function ComparisonOption({
  as,
  children,
  recommended = false,
  recommendedLabel = "Recommended",
  ref,
  value,
  ...props
}: ComparisonOptionProps) {
  const { collection } = useComparisonContext("ComparisonOption");
  const [element, setElement] = useState<HTMLTableCellElement | null>(null);

  useLayoutEffect(() => {
    if (!element) return;
    collection.register({
      key: value,
      textValue: element.textContent ?? value,
      element,
      recommended,
    });
    return () => {
      collection.unregister(value, element);
    };
  }, [collection, element, recommended, value]);

  const Part = partElement(as, "th");
  return (
    <Part
      data-slot="comparison-option"
      {...props}
      ref={composeRefs(ref, setElement)}
      scope="col"
      data-value={value}
      data-recommended={dataAttr(recommended)}
    >
      {children}
      {recommended ? <VisuallyHidden>, {recommendedLabel}</VisuallyHidden> : null}
    </Part>
  );
}
