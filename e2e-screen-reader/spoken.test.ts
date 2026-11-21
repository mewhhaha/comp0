import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { heard, nvdaPhrases, voiceOverPhrases } from "./spoken.js";

// The real-reader specs only run on macOS and Windows runners; the matching they rely on is
// checked here, on every run, with the phrase shapes VoiceOver and NVDA produce.

describe("heard", () => {
  it("finds role, name and state spoken in one utterance", () => {
    expect(
      heard(
        ["Medium, Size, collapsed, pop-up button"],
        ["Size", voiceOverPhrases.popupButton, voiceOverPhrases.collapsed],
      ),
    ).toBe(true);
  });

  it("finds a phrase split across two consecutive utterances", () => {
    expect(
      heard(
        ["Size  Medium", "button  collapsed"],
        ["Size", nvdaPhrases.popupButton, nvdaPhrases.collapsed],
      ),
    ).toBe(true);
  });

  it("does not join utterances that are further apart than two", () => {
    expect(heard(["City", "Filter cities", "collapsed"], ["City", nvdaPhrases.collapsed])).toBe(
      false,
    );
  });

  it("reports a missing term as not heard", () => {
    expect(heard(["Size, Medium, pop-up button"], ["Size", voiceOverPhrases.expanded])).toBe(false);
    expect(heard([], ["Size"])).toBe(false);
  });

  it("does not let a usage hint supply the role", () => {
    const hint =
      "You are currently on a menu button. To display a list of options, press Control-Option-Space.";
    expect(heard(["Actions, collapsed", hint], ["Actions", /menu button/i])).toBe(false);
    expect(heard(["Actions, collapsed, menu button", hint], ["Actions", /menu button/i])).toBe(
      true,
    );
  });

  it("skips a usage hint between the two halves of a split phrase", () => {
    expect(
      heard(
        ["Open dialog", "To click this button, press Control-Option-Space.", "button"],
        ["Open dialog", voiceOverPhrases.button],
      ),
    ).toBe(true);
  });

  it("tells checked from unchecked and not checked", () => {
    const name = "Send me product updates";
    expect(heard([`${name}, unchecked, checkbox`], [name, voiceOverPhrases.checked])).toBe(false);
    expect(heard([`${name}, unchecked, checkbox`], [name, voiceOverPhrases.unchecked])).toBe(true);
    expect(heard([`${name}  check box  not checked`], [name, nvdaPhrases.checked])).toBe(false);
    expect(heard([`${name}  check box  not checked`], [name, nvdaPhrases.unchecked])).toBe(true);
    expect(heard([`${name}  check box  checked`], [name, nvdaPhrases.checked])).toBe(true);
  });

  it("tells selected from not selected", () => {
    expect(heard(["Code  tab  not selected  2 of 2"], ["Code", nvdaPhrases.selected])).toBe(false);
    expect(heard(["Code  tab  selected  2 of 2"], ["Code", nvdaPhrases.selected])).toBe(true);
  });
});

describe("screen reader scripts", () => {
  it("run the same command on macOS and Windows shells", () => {
    // Vitest runs from the repository root; jsdom gives import.meta.url an http scheme.
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(manifest.scripts["test:screen-reader:voiceover"]).toBe(
      "playwright test -c playwright.screen-reader.config.ts --project voiceover",
    );
    expect(manifest.scripts["test:screen-reader:nvda"]).toBe(
      "playwright test -c playwright.screen-reader.config.ts --project nvda",
    );
  });
});
