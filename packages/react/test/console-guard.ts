/**
 * Fails any test that logs through `console.error` or `console.warn` without
 * expecting it. React reports key warnings, act() warnings, hydration
 * mismatches, and updates on unmounted components this way, and comp0's own
 * `warnOnce` does too, so an unexpected message is a bug the test would
 * otherwise pass over.
 *
 * A test that expects a message spies on the method (`vi.spyOn(console,
 * "error").mockImplementation(() => undefined)`) and asserts on the spy; the
 * spy replaces the guard until it is restored, so expected messages never
 * reach it.
 */
import { afterEach, beforeEach } from "vitest";

const methods = ["error", "warn"] as const;
type Method = (typeof methods)[number];

const originals = { error: console.error, warn: console.warn };
let unexpected: string[] = [];
let allowed: RegExp[] = [];

/**
 * Lets the current test log messages matching `pattern` without failing, while any other
 * message still fails it. Prefer a spy with assertions when the message is the behavior under
 * test; use this for noise the test cannot avoid, and say why at the call site.
 */
export function allowConsole(pattern: RegExp) {
  allowed.push(pattern);
}

function format(args: unknown[]) {
  return args
    .map((arg) => {
      if (arg instanceof Error) return arg.stack ?? arg.message;
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

function guard(method: Method) {
  return (...args: unknown[]) => {
    const message = format(args);
    if (allowed.some((pattern) => pattern.test(message))) return;
    unexpected.push(`console.${method}: ${message}`);
    originals[method](...args);
  };
}

/** `alwaysAllowed` is noise a whole project cannot avoid; give the reason where it is passed. */
export function installConsoleGuard(alwaysAllowed: RegExp[] = []) {
  beforeEach(() => {
    unexpected = [];
    allowed = [...alwaysAllowed];
    for (const method of methods) console[method] = guard(method);
  });

  afterEach(() => {
    for (const method of methods) console[method] = originals[method];
    const messages = unexpected;
    unexpected = [];
    if (messages.length > 0) {
      throw new Error(
        `Unexpected console output (spy on console with mockImplementation if it is expected):\n\n${messages.join("\n\n")}`,
      );
    }
  });
}
