import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useAvatarContext } from "./avatar-shared.js";

export type AvatarFallbackProps = HTMLAttributes<HTMLSpanElement>;

export function AvatarFallback({
  hidden,
  ref,
  ...props
}: AvatarFallbackProps & RefProp<HTMLSpanElement>) {
  const avatar = useAvatarContext("AvatarFallback");
  return (
    <span
      {...props}
      ref={ref}
      hidden={hidden || avatar.status === "loaded"}
      data-slot={dataSlot(props, "avatar-fallback")}
    />
  );
}
