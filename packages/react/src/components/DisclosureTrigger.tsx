import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { DisclosureContext } from "./disclosure-shared.js";
import { type DisclosureTriggerProps } from "./disclosure-shared.js";
export type { DisclosureTriggerProps } from "./disclosure-shared.js";
export function DisclosureTrigger(props: DisclosureTriggerProps & RefProp<HTMLElement>) {
  const { ref } = props;
  const disclosure = useContext(DisclosureContext);
  return (
    <summary
      {...props}
      ref={ref as never}
      aria-expanded={disclosure?.open}
      aria-controls={disclosure?.panelId}
      data-open={dataAttr(disclosure?.open)}
    />
  );
}
