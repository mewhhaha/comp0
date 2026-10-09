import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type CitationSource = {
  value: string;
  title: string;
};

export type CitationsContextValue = {
  baseId: string;
  /** Registered sources in document order. */
  sources: CitationSource[];
  /** The document-order registry every Source joins. */
  collection: Collection;
};

export const [CitationsContext, useCitationsContext] =
  createRequiredContext<CitationsContextValue>("Citations");

export const sourceId = (baseId: string, value: string) => `${baseId}-source-${value}`;
