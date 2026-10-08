import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useDisclosureContext } from "./disclosure-shared.js";

export type DisclosurePanelProps = ComponentProps<"div"> & AsProp;

export function DisclosurePanel({ as, id, ...props }: DisclosurePanelProps) {
  const disclosure = useDisclosureContext("DisclosurePanel");

  const Part = partElement(as, "div");
  return <Part {...props} id={id ?? disclosure.panelId} data-open={dataAttr(disclosure.open)} />;
}
