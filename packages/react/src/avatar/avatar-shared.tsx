import { createRequiredContext } from "../internal/context.js";

export type AvatarStatus = "idle" | "loading" | "loaded" | "error";

export type AvatarContextValue = {
  status: AvatarStatus;
  setStatus: (status: AvatarStatus) => void;
};

export const [AvatarContext, useAvatarContext] =
  createRequiredContext<AvatarContextValue>("Avatar");
