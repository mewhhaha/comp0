import { useCallback } from "react";
import { useBusy } from "./busy.js";

// Declared locally so the file typechecks without node types (the docs prop guard compiles with none).
declare const process: { env: { NODE_ENV?: string | undefined } };

function isDevelopment() {
  try {
    // Written literally so consumer bundlers replace it and strip DEV branches.
    return process.env.NODE_ENV !== "production";
  } catch {
    // No `process` and no bundler replacement: treat the page as development.
    return true;
  }
}

/** True outside production builds. Guard dev-only validation and warnings with it. */
export const DEV: boolean = isDevelopment();

const warned = new Set<string>();

/**
 * Logs `message` with `console.error` the first time `key` is seen, in
 * development only. Use it for invalid runtime data, paired with a safe
 * production fallback, instead of throwing during render.
 */
export function warnOnce(key: string, message: string) {
  if (!DEV || warned.has(key)) return;
  warned.add(key);
  console.error(message);
}

/** A `warnOnce` that may hold back reports; pure builders take it as their first argument. */
export type Warn = (key: string, message: string) => void;

/**
 * Returns `warnOnce` for data validated during render. Inside a busy region
 * the data may simply be incomplete (a streamed answer still arriving), so
 * warnings wait: the busy flag flipping off re-renders the part, which then
 * reports whatever is still invalid.
 */
export function useWarnOnce(): Warn {
  const busy = useBusy();
  // Semantic identity: it changes only when the busy flag does, so effects that
  // report problems can list it as a dependency and re-run once when the region settles.
  return useCallback<Warn>(
    (key, message) => {
      if (!busy) warnOnce(key, message);
    },
    [busy],
  );
}
