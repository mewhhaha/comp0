import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFieldContext } from "./field-shared.js";

export type LegendProps = ComponentProps<"legend"> & AsProp;

export function Legend({ as, id, ...props }: LegendProps) {
  const field = useFieldContext();
  const Part = partElement(as, "legend");
  return <Part {...props} id={id ?? field?.labelId} />;
}
