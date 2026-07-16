import { useEffect, useRef, type ImgHTMLAttributes } from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useAvatarContext } from "./avatar-shared.js";

export type AvatarImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function AvatarImage({
  alt,
  hidden,
  onError,
  onLoad,
  ref,
  ...props
}: AvatarImageProps & RefProp<HTMLImageElement>) {
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

  return (
    <img
      {...props}
      ref={composeRefs(ref, imageRef)}
      alt={alt}
      hidden={hidden || avatar.status !== "loaded"}
      data-slot={dataSlot(props, "avatar-image")}
      onLoad={(event) => {
        onLoad?.(event);
        if (!event.defaultPrevented) setStatus("loaded");
      }}
      onError={(event) => {
        onError?.(event);
        if (!event.defaultPrevented) setStatus("error");
      }}
    />
  );
}
