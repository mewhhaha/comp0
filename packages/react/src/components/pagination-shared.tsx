import { createContext, useContext } from "react";

export type PaginationContextValue = {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export const PaginationContext = createContext<PaginationContextValue | null>(null);

export function usePaginationContext(component: string) {
  const context = useContext(PaginationContext);
  if (!context) throw new Error(`${component} must be rendered inside Pagination.`);
  return context;
}
