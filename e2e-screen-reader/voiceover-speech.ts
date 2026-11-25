import { execFile } from "node:child_process";

// Guidepup's capture reads VoiceOver's last phrase and then waits in proportion to that phrase's
// length before reading again. When the first phrase it reads is still the previous step's, that
// wait outlasts a short announcement ("Warsaw, 1 of 3"), which VoiceOver's hint then replaces, so
// the announcement never reaches the log. This recorder reads the last phrase every few
// milliseconds instead and keeps every new one.

const script = [
  'tell application "VoiceOver"',
  "with transaction",
  "return content of last phrase",
  "end transaction",
  "end tell",
].flatMap((line) => ["-e", line]);

function lastPhrase() {
  return new Promise<string>((resolve) => {
    execFile("/usr/bin/osascript", script, { timeout: 5_000 }, (error, stdout) => {
      if (error) return resolve("");
      resolve(
        stdout
          .trim()
          .replace(/^missing value$/, "")
          .replaceAll("@VOModifier()", "Control-Option")
          .replace(/\s\s+/g, " "),
      );
    });
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `action` and returns each phrase VoiceOver speaks after it, in order. Stops once nothing
 * new has been spoken for `quiet` ms (long enough for the usage hint that follows an
 * announcement), or after `max` ms.
 */
export async function speechAfter(
  action: () => Promise<unknown>,
  { quiet = 2_500, max = 10_000 } = {},
) {
  let last = await lastPhrase();
  await action();
  const phrases: string[] = [];
  const start = Date.now();
  let changed = start;
  while (Date.now() - start < max) {
    const phrase = await lastPhrase();
    const now = Date.now();
    if (phrase && phrase !== last) {
      phrases.push(phrase);
      last = phrase;
      changed = now;
    } else if (phrases.length > 0 && now - changed > quiet) {
      break;
    }
    await delay(20);
  }
  return phrases;
}
