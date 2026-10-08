import { useEffect, useRef, type ComponentProps, type SyntheticEvent } from "react";
import { composeRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useAvatarContext } from "./avatar-shared.js";

export type AvatarImageProps = ComponentProps<"img"> & AsProp;

export function AvatarImage({ as, alt, hidden, onError, onLoad, ref, ...props }: AvatarImageProps) {
  const avatar = useAvatarContext("AvatarImage");
  const { setStatus } = avatar;
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    // A cached image can finish before hydration attaches listeners, so its
    // load event never reaches React; read the completed state on mount.
    if (image.complete && image.naturalWidth > 0) setStatus("loaded");
    else setStatus("loading");
  }, [setStatus]);

  const Part = partElement(as, "img");
  return (
    <Part
      {...props}
      ref={composeRefs(ref, imageRef)}
      alt={alt}
      hidden={hidden || avatar.status !== "loaded"}
      data-slot={dataSlot(props, "avatar-image")}
      onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
        onLoad?.(event);
        if (!event.defaultPrevented) setStatus("loaded");
      }}
      onError={(event: SyntheticEvent<HTMLImageElement>) => {
        onError?.(event);
        if (!event.defaultPrevented) setStatus("error");
      }}
    />
  );
}
