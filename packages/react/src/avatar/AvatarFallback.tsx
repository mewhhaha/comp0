import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useAvatarContext } from "./avatar-shared.js";

export type AvatarFallbackProps = ComponentProps<"span"> & AsProp;

export function AvatarFallback({ as, hidden, ...props }: AvatarFallbackProps) {
  const avatar = useAvatarContext("AvatarFallback");
  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      hidden={hidden || avatar.status === "loaded"}
      data-slot={dataSlot(props, "avatar-fallback")}
    />
  );
}
