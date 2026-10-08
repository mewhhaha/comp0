import { createRequiredContext } from "../internal/context.js";

export type PaginationContextValue = {
  value: number;
  totalPages: number;
  setValue: (value: number) => void;
};

export const [PaginationContext, usePaginationContext] =
  createRequiredContext<PaginationContextValue>("Pagination");
