import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { fieldFeedbackPart, useFieldContext } from "./field-shared.js";

export type DescriptionProps = ComponentProps<"div"> & AsProp;

export function Description({ as, id, ...props }: DescriptionProps) {
  const field = useFieldContext();
  const Part = partElement(as, "div");
  return <Part {...props} id={id ?? field?.descriptionId} />;
}

Object.assign(Description, { [fieldFeedbackPart]: "description" as const });
