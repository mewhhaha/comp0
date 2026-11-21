import { voiceOverTest as test } from "@guidepup/playwright";
import { runScenario, scenarios } from "./scenarios.js";
import { voiceOverPhrases } from "./spoken.js";

// VoiceOver on macOS with WebKit. The fixture starts VoiceOver for each test and stops it in
// teardown, so a failed attempt never leaves it running into the next test.

// Capture everything said, usage hints included; `heard` ignores the hints.
test.use({ voiceOverStartOptions: { capture: true } });

for (const scenario of scenarios) {
  test(`VoiceOver: ${scenario.slug}`, ({ page, voiceOver }) =>
    runScenario(scenario, {
      page,
      reader: voiceOver,
      phrases: voiceOverPhrases,
      tabKey: "Alt+Tab",
      // What has keyboard focus (VO-F4), then what the VoiceOver cursor is on (VO-F3): an option
      // reached through aria-activedescendant has the cursor but not focus. They go through
      // VoiceOver's commander, not as key presses: F3 and F4 are Mission Control and Launchpad
      // keys on the runner, which take the screen away from the browser.
      describers: [
        () => voiceOver.perform(voiceOver.commanderCommands.DESCRIBE_ITEM_WITH_KEYBOARD_FOCUS),
        () => voiceOver.perform(voiceOver.commanderCommands.DESCRIBE_ITEM_IN_VOICEOVER_CURSOR),
      ],
    }));
}
