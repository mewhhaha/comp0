import { type ComponentProps } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type StepsListProps = ComponentProps<"ol"> & AsProp;

/** Ordered list of steps; the sequence itself is meaningful. */
export function StepsList({ as, children, ...props }: StepsListProps) {
  // Inside the collection pass only the items matter, so the list renders no element.
  const collecting = useIsCollectionPass();
  if (collecting) return children;
  const Part = partElement(as, "ol");
  return (
    <Part data-comp0="steps-list" {...props}>
      {children}
    </Part>
  );
}
