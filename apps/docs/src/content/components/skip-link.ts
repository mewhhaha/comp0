import { component, p, prop } from "../define.js";

export default component({
  slug: "skip-link",
  title: "Skip Link",
  group: "navigation",
  summary: "A hidden link that lets keyboard users jump past repeated content.",
  analogy: "Like an express elevator straight past the lobby floors.",
  whenToUse:
    "Use it as the first focusable element so keyboard users can bypass navigation (WCAG 2.4.1).",
  steps: {
    main: "Put SkipLink first inside body, before the repeated navigation.",
    supporting: 'Point href at the main content, such as "#main".',
    behavior: "Give the target element the matching id and tabIndex={-1} so focus lands there.",
    code: '<SkipLink href="#main">Skip to main content</SkipLink>;',
  },
  imports: ["SkipLink"],
  snippet: '<SkipLink href="#main">Skip to main content</SkipLink>;',
  parts: [
    p(
      "SkipLink",
      "root",
      "Native anchor that stays visually hidden until it receives focus.",
      true,
      false,
      [
        prop("href", "string", 'In-page target the link jumps to, such as "#main".'),
        prop(
          "className / style",
          "string / CSSProperties",
          "Styles the revealed link; merged with the hiding styles while hidden.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Reveals the link when it receives focus." },
    { keys: ["Enter"], action: "Jumps to the target and hides the link again." },
  ],
  stateHooks: [
    { attribute: "[data-focused]", on: "SkipLink", meaning: "The link is focused and visible." },
    {
      attribute: ":focus-visible",
      on: "SkipLink",
      meaning: "Native keyboard-focus styling hook.",
    },
  ],
  form: "No form behavior.",
  accessibility: [
    "Make it the first focusable element on the page.",
    "Style the revealed state clearly; it appears exactly when a keyboard user needs it.",
    "Point href at a real element with a matching id, and give that target tabIndex={-1}.",
    "Use native header, nav, main, aside, and footer landmarks so assistive technology can navigate the page structure directly.",
  ],
  related: ["link", "visually-hidden"],
  moreExamples: [
    {
      id: "page-shell",
      title: "Landmark page shell",
      description: "Pair the first skip link with native header, nav, main, and footer landmarks.",
    },
  ],
});
