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
      // What has keyboard focus (VO-Shift-F4), then what the VoiceOver cursor is on (VO-F3):
      // an option reached through aria-activedescendant has the cursor but not focus.
      describers: [
        () => voiceOver.perform(voiceOver.keyboardCommands.describeItemWithKeyboardFocus),
        () => voiceOver.perform(voiceOver.keyboardCommands.describeItem),
      ],
    }));
}
