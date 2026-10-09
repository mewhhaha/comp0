import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type SourcesProps = ComponentProps<"ol"> & AsProp;

/** The ordered list of sources; a citation's number is its source's position here. */
export function Sources({ as, ...props }: SourcesProps) {
  const Part = partElement(as, "ol");
  return <Part data-slot="sources" {...props} />;
}
