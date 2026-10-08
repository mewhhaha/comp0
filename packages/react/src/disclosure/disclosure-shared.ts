import { createRequiredContext } from "../internal/context.js";

export type DisclosureContextValue = {
  open: boolean;
  panelId: string;
};

export const [DisclosureContext, useDisclosureContext] =
  createRequiredContext<DisclosureContextValue>("Disclosure");
