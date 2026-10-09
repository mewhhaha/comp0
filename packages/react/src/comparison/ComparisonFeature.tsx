import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ComparisonFeatureProps = Omit<ComponentProps<"th">, "scope"> & AsProp;

/** A row header naming one feature; assistive technology announces it with every value in the row. */
export function ComparisonFeature({ as, ...props }: ComparisonFeatureProps) {
  const Part = partElement(as, "th");
  return <Part data-slot="comparison-feature" {...props} scope="row" />;
}
