import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { DisclosureContext } from "./disclosure-shared.js";
import { type DisclosurePanelProps } from "./disclosure-shared.js";
export type { DisclosurePanelProps } from "./disclosure-shared.js";
export function DisclosurePanel({
  id,
  ref,
  ...props
}: DisclosurePanelProps & RefProp<HTMLDivElement>) {
  const disclosure = useContext(DisclosureContext);
  return (
    <div
      {...props}
      ref={ref}
      id={id ?? disclosure?.panelId}
      data-open={dataAttr(disclosure?.open)}
    />
  );
}
