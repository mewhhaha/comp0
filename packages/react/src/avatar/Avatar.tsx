import { useState, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { AvatarContext, type AvatarStatus } from "./avatar-shared.js";

export type AvatarProps = ComponentProps<"span"> & AsProp;

export function Avatar({ as, ...props }: AvatarProps) {
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const Part = partElement(as, "span");
  return (
    <AvatarContext value={{ status, setStatus }}>
      <Part
        data-slot="avatar"
        {...props}
        data-error={dataAttr(status === "error")}
        data-loaded={dataAttr(status === "loaded")}
      />
    </AvatarContext>
  );
}
