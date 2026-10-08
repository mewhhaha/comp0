import { createContext, use, type Context } from "react";

/**
 * Creates the context a root shares with its parts, plus hooks to read it.
 * Parts that cannot work alone read it with `useRequired("PartName")`, which
 * throws `PartName must be rendered inside RootName.`; parts that also work
 * standalone read it with `useOptional()`.
 */
export function createRequiredContext<T>(rootName: string) {
  const RequiredContext: Context<T | null> = createContext<T | null>(null);
  RequiredContext.displayName = `${rootName}Context`;

  function useRequired(partName: string): T {
    const value = use(RequiredContext);
    if (value === null) throw new Error(`${partName} must be rendered inside ${rootName}.`);
    return value;
  }

  function useOptional(): T | null {
    return use(RequiredContext);
  }

  return [RequiredContext, useRequired, useOptional] as const;
}
