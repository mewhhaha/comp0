import { useState, type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { AvatarContext, type AvatarStatus } from "./avatar-shared.js";

export type AvatarProps = HTMLAttributes<HTMLSpanElement>;

export function Avatar({ ref, ...props }: AvatarProps & RefProp<HTMLSpanElement>) {
  const [status, setStatus] = useState<AvatarStatus>("idle");
  return (
    <AvatarContext value={{ status, setStatus }}>
      <span
        {...props}
        ref={ref}
        data-error={dataAttr(status === "error")}
        data-loaded={dataAttr(status === "loaded")}
        data-slot={dataSlot(props, "avatar")}
      />
    </AvatarContext>
  );
}
