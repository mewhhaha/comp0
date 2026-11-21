import { expect, test, type Locator, type Page } from "@playwright/test";
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
  /**
   * Reader commands that describe where the reader is, tried in order when an announcement does
   * not come on its own. VoiceOver sometimes drops the announcement for a focus or state change
   * and speaks only its usage hint, though the page and the reader's own model are right; asking
   * it is what a user does (VO-Shift-F4, VO-F3), and the answer is checked for the same terms.
   */
  describers?: readonly (() => Promise<unknown>)[];
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

type HeardOptions = { hints?: boolean };

/**
 * Presses `key` and checks the reader says `terms` because of it. VoiceOver can finish the
 * previous announcement first and only then read the new one, so its log is polled. If the
 * announcement never comes, the reader is asked to describe where it is (see `describers`); the
 * test fails only if no answer has the terms either.
 */
async function expectSaid(
  context: ScenarioContext,
  key: string,
  terms: readonly Term[],
  when: string,
  options?: HeardOptions,
) {
  const before = (await context.reader.spokenPhraseLog()).length;
  // NVDA's capture returns the phrase it spoke; VoiceOver's later speech only reaches the log.
  const captured = await say(context, () => context.page.keyboard.press(key));
  await confirmSaid(context, before, captured, terms, when, options);
}

async function confirmSaid(
  context: ScenarioContext,
  before: number,
  captured: readonly string[],
  terms: readonly Term[],
  when: string,
  options?: HeardOptions,
) {
  let utterances = [...captured];
  try {
    await expect
      .poll(
        async () => {
          utterances = [...captured, ...(await context.reader.spokenPhraseLog()).slice(before)];
          return heard(utterances, terms, options);
        },
        { timeout: 5_000 },
      )
      .toBe(true);
    return;
  } catch {
    // Fall through to the describers, then to a failure that names everything heard.
  }
  const spoken = utterances;
  for (const describe of context.describers ?? []) {
    const described = await say(context, describe);
    if (heard(described, terms, options)) {
      test.info().annotations.push({
        type: "screen reader",
        description: `${when}: not announced on its own (heard ${JSON.stringify(spoken)}); described on request as ${JSON.stringify(described)}`,
      });
      return;
    }
    utterances = [...utterances, ...described];
  }
  expectHeard(utterances, terms, when, options);
}

/**
 * Moves focus to the start of the example, then tabs until `target` has focus, the way a
 * keyboard user enters it, and checks the reader says `terms` at that stop.
 */
async function tabTo(
  context: ScenarioContext,
  target: Locator,
  terms: readonly Term[],
  when: string,
) {
  await context.region.evaluate((element) => {
    element.setAttribute("tabindex", "-1");
    (element as HTMLElement).focus();
  });
  for (let stop = 0; stop < 10; stop++) {
    const before = (await context.reader.spokenPhraseLog()).length;
    const captured = await say(context, () => context.page.keyboard.press(context.tabKey));
    if (await target.evaluate((element) => element === document.activeElement)) {
      await confirmSaid(context, before, captured, terms, when);
      return;
    }
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
      await tabTo(
        context,
        trigger,
        ["Size", phrases.popupButton, phrases.popupClosed],
        "focus on the trigger",
      );
      // Opening moves focus to the selected option, so the option is what is announced.
      await expectSaid(context, "Enter", ["Medium", phrases.option], "open");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expectSaid(
        context,
        "Escape",
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
      await tabTo(
        context,
        input,
        ["City", phrases.comboBox, phrases.popupClosed],
        "focus on the input",
      );
      // Opening moves the reader to the first option, so the option is what is announced; NVDA
      // never speaks the input's new "expanded" state, so that is checked on the element.
      // VoiceOver names the option's role only in its hint ("a selectable").
      await expectSaid(context, "ArrowDown", ["Warsaw", phrases.option], "open", {
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
      await tabTo(
        context,
        checkbox,
        [name, phrases.checkbox, phrases.checked],
        "focus on the checkbox",
      );
      await expectSaid(context, "Space", [phrases.unchecked], "toggle");
      await expect(checkbox).not.toBeChecked();
    },
  },
  {
    slug: "tabs",
    async run(context) {
      const { phrases, region } = context;
      await tabTo(
        context,
        region.getByRole("tab", { name: "Preview" }),
        ["Preview", phrases.tab, phrases.selected],
        "focus on the selected tab",
      );
      await expectSaid(context, "ArrowRight", ["Code", phrases.tab, phrases.selected], "next tab");
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
      await tabTo(
        context,
        region.getByRole("treeitem", { name: "README.md" }), // NVDA reads the extension as "dot md".
        ["README", phrases.treeItem],
        "focus on the selected item",
      );
      await expectSaid(context, "Home", ["src", phrases.treeItem, phrases.expanded], "first item");
      const src = region.getByRole("treeitem").first();
      await expectSaid(context, "ArrowLeft", [phrases.collapsed], "collapse");
      await expect(src).toHaveAttribute("aria-expanded", "false");
      await expectSaid(context, "ArrowRight", [phrases.expanded], "expand");
      await expect(src).toHaveAttribute("aria-expanded", "true");
    },
  },
  {
    slug: "dialog",
    async run(context) {
      const { page, phrases, region } = context;
      const trigger = region.getByRole("button", { name: "Open dialog" });
      await tabTo(context, trigger, ["Open dialog", phrases.button], "focus on the trigger");
      // VoiceOver announces the dialog only in its hint ("inside of a web dialog"), so the
      // role is taken from the hint and the name from the page.
      await expectSaid(context, "Enter", [phrases.dialog], "open", { hints: true });
      await expect(page.getByRole("dialog", { name: "Example dialog" })).toBeVisible();
      await expectSaid(context, "Escape", ["Open dialog", phrases.button], "close");
      await expect(trigger).toBeFocused();
    },
  },
  {
    slug: "menu",
    async run(context) {
      const { page, phrases, region } = context;
      const trigger = region.getByRole("button", { name: "Actions" });
      await tabTo(context, trigger, ["Actions", phrases.popupButton], "focus on the trigger");
      // VoiceOver says where focus landed only in its hint ("You are currently on a menu
      // item"), so the role is taken from the hint and the focused item from the page.
      await expectSaid(context, "Enter", [phrases.menuItem], "open", { hints: true });
      await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
      await expectSaid(context, "Escape", ["Actions", phrases.popupButton], "close");
      await expect(trigger).toBeFocused();
    },
  },
];
