import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useDisclosureContext } from "./disclosure-shared.js";

export type DisclosureTriggerProps = ComponentProps<"summary"> & AsProp;

export function DisclosureTrigger({ as, ...props }: DisclosureTriggerProps) {
  const disclosure = useDisclosureContext("DisclosureTrigger");

  const Part = partElement(as, "summary");
  return (
    <Part
      {...props}
      aria-expanded={disclosure.open}
      aria-controls={disclosure.panelId}
      data-open={dataAttr(disclosure.open)}
    />
  );
}
