import type { BrowserContextOptions } from "@playwright/test";

/**
 * The context permissions that let a page write and read the clipboard, per engine. Each engine
 * rejects permission names it does not know: Firefox lets a page use the async clipboard without
 * any, and WebKit writes on a user gesture but has a permission only for reading.
 */
const clipboardPermissions: Record<string, string[]> = {
  chromium: ["clipboard-read", "clipboard-write"],
  firefox: [],
  webkit: ["clipboard-read"],
};

/** For `test.use({ permissions: clipboardAccess })`. */
export const clipboardAccess = async (
  { browserName }: { browserName: string },
  use: (permissions: BrowserContextOptions["permissions"]) => Promise<void>,
) => {
  await use(clipboardPermissions[browserName]);
};
