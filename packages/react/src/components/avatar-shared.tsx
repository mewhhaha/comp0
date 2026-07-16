import { createContext, useContext } from "react";

export type AvatarStatus = "idle" | "loading" | "loaded" | "error";

export interface AvatarContextValue {
  status: AvatarStatus;
  setStatus: (status: AvatarStatus) => void;
}

export const AvatarContext = createContext<AvatarContextValue | null>(null);

export function useAvatarContext(part: string) {
  const context = useContext(AvatarContext);
  if (!context) throw new Error(`${part} must be rendered inside Avatar.`);
  return context;
}
