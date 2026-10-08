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
