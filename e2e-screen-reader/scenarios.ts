import { expect, type Locator, type Page } from "@playwright/test";
import type { NVDAPlaywright, VoiceOverPlaywright } from "@guidepup/playwright";
import { visitExample } from "../e2e/wcag.js";
import { heard, type Phrases, type Term } from "./spoken.js";

// Component scenarios shared by the VoiceOver and NVDA specs. Keys go to the page through
// Playwright, so both readers meet the same input; each reader's announcement is captured and
// checked for the role, the accessible name and the state, in that reader's wording.

type ScenarioContext = {
  page: Page;
  /** The page's Live example region, already past "Loading example…". */
  region: Locator;
  reader: VoiceOverPlaywright | NVDAPlaywright;
  phrases: Phrases;
  /** WebKit only tabs to buttons and checkboxes with Option held; Chromium tabs to everything. */
  tabKey: string;
};

type Scenario = {
  slug: string;
  run: (context: ScenarioContext) => Promise<void>;
};

/**
 * Opens the scenario's docs page, brings the browser window to the front so the reader reads
 * it, and runs the scenario.
 */
export async function runScenario(scenario: Scenario, context: Omit<ScenarioContext, "region">) {
  const region = await visitExample(context.page, scenario.slug);
  await context.reader.navigateToWebContent();
  await scenario.run({ ...context, region });
}

/** Runs an action and returns what the reader said because of it. */
async function say(context: ScenarioContext, action: () => Promise<unknown>) {
  const before = (await context.reader.spokenPhraseLog()).length;
  const { spokenPhrase } = await context.reader.capture(action);
  const utterances = (await context.reader.spokenPhraseLog()).slice(before);
  if (utterances.at(-1) !== spokenPhrase) utterances.push(spokenPhrase);
  return utterances;
}

function press(context: ScenarioContext, key: string) {
  return say(context, () => context.page.keyboard.press(key));
}

/**
 * Presses a key and waits for the reader to say `terms`. VoiceOver can finish the previous
 * announcement first (a menu item's hint after Escape) and only then read where focus returned.
 */
async function pressUntilHeard(
  context: ScenarioContext,
  key: string,
  terms: readonly Term[],
  when: string,
) {
  const before = (await context.reader.spokenPhraseLog()).length;
  await context.page.keyboard.press(key);
  await expect
    .poll(async () => heard((await context.reader.spokenPhraseLog()).slice(before), terms), {
      timeout: 10_000,
      message: `${when}: expected ${terms.map(String).join(" + ")}`,
    })
    .toBe(true);
}

/**
 * Moves focus to the start of the example, then tabs until `target` has focus, the way a
 * keyboard user enters it. Returns what the reader said at the last stop.
 */
async function tabTo(context: ScenarioContext, target: Locator) {
  await context.region.evaluate((element) => {
    element.setAttribute("tabindex", "-1");
    (element as HTMLElement).focus();
  });
  for (let stop = 0; stop < 10; stop++) {
    const utterances = await press(context, context.tabKey);
    if (await target.evaluate((element) => element === document.activeElement)) return utterances;
  }
  throw new Error(`${context.tabKey} never reached ${target} from the start of the Live example`);
}

function expectHeard(
  utterances: readonly string[],
  terms: readonly Term[],
  when: string,
  options?: { hints?: boolean },
) {
  expect(
    heard(utterances, terms, options),
    `${when}: expected ${terms.map(String).join(" + ")} in one announcement; heard ${JSON.stringify(utterances)}`,
  ).toBe(true);
}

export const scenarios: Scenario[] = [
  {
    slug: "select",
    async run(context) {
      const { phrases, region } = context;
      const trigger = region.locator("button[aria-haspopup='listbox']");
      expectHeard(
        await tabTo(context, trigger),
        ["Size", phrases.popupButton, phrases.popupClosed],
        "focus on the trigger",
      );
      // Opening moves focus to the selected option, so the option is what is announced.
      expectHeard(await press(context, "Enter"), ["Medium", phrases.option], "open");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      expectHeard(
        await press(context, "Escape"),
        ["Size", phrases.popupButton, phrases.popupClosed],
        "close",
      );
      await expect(trigger).toBeFocused();
    },
  },
  {
    slug: "combobox",
    async run(context) {
      const { phrases, region } = context;
      const input = region.getByRole("combobox", { name: "City" });
      expectHeard(
        await tabTo(context, input),
        ["City", phrases.comboBox, phrases.popupClosed],
        "focus on the input",
      );
      // Opening moves the reader to the first option, so the option is what is announced; NVDA
      // never speaks the input's new "expanded" state, so that is checked on the element.
      // VoiceOver names the option's role only in its hint ("a selectable").
      expectHeard(await press(context, "ArrowDown"), ["Warsaw", phrases.option], "open", {
        hints: true,
      });
      await expect(input).toHaveAttribute("aria-expanded", "true");
    },
  },
  {
    slug: "checkbox",
    async run(context) {
      const { phrases, region } = context;
      const name = "Send me product updates";
      const checkbox = region.getByRole("checkbox", { name });
      expectHeard(
        await tabTo(context, checkbox),
        [name, phrases.checkbox, phrases.checked],
        "focus on the checkbox",
      );
      expectHeard(await press(context, "Space"), [phrases.unchecked], "toggle");
      await expect(checkbox).not.toBeChecked();
    },
  },
  {
    slug: "tabs",
    async run(context) {
      const { phrases, region } = context;
      expectHeard(
        await tabTo(context, region.getByRole("tab", { name: "Preview" })),
        ["Preview", phrases.tab, phrases.selected],
        "focus on the selected tab",
      );
      expectHeard(
        await press(context, "ArrowRight"),
        ["Code", phrases.tab, phrases.selected],
        "next tab",
      );
      await expect(region.getByRole("tab", { name: "Code" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },
  {
    slug: "tree",
    async run(context) {
      const { phrases, region } = context;
      expectHeard(
        await tabTo(context, region.getByRole("treeitem", { name: "README.md" })),
        // NVDA reads the extension as "dot md".
        ["README", phrases.treeItem],
        "focus on the selected item",
      );
      expectHeard(
        await press(context, "Home"),
        ["src", phrases.treeItem, phrases.expanded],
        "first item",
      );
      const src = region.getByRole("treeitem").first();
      expectHeard(await press(context, "ArrowLeft"), [phrases.collapsed], "collapse");
      await expect(src).toHaveAttribute("aria-expanded", "false");
      expectHeard(await press(context, "ArrowRight"), [phrases.expanded], "expand");
      await expect(src).toHaveAttribute("aria-expanded", "true");
    },
  },
  {
    slug: "dialog",
    async run(context) {
      const { page, phrases, region } = context;
      const trigger = region.getByRole("button", { name: "Open dialog" });
      expectHeard(
        await tabTo(context, trigger),
        ["Open dialog", phrases.button],
        "focus on the trigger",
      );
      // VoiceOver announces the dialog only in its hint ("inside of a web dialog"), so the
      // role is taken from the hint and the name from the page.
      expectHeard(await press(context, "Enter"), [phrases.dialog], "open", { hints: true });
      await expect(page.getByRole("dialog", { name: "Example dialog" })).toBeVisible();
      expectHeard(await press(context, "Escape"), ["Open dialog", phrases.button], "close");
      await expect(trigger).toBeFocused();
    },
  },
  {
    slug: "menu",
    async run(context) {
      const { page, phrases, region } = context;
      const trigger = region.getByRole("button", { name: "Actions" });
      expectHeard(
        await tabTo(context, trigger),
        ["Actions", phrases.popupButton],
        "focus on the trigger",
      );
      // VoiceOver says where focus landed only in its hint ("You are currently on a menu
      // item"), so the role is taken from the hint and the focused item from the page.
      expectHeard(await press(context, "Enter"), [phrases.menuItem], "open", { hints: true });
      await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
      await pressUntilHeard(context, "Escape", ["Actions", phrases.popupButton], "close");
      await expect(trigger).toBeFocused();
    },
  },
];
