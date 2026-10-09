import { component, p, prop } from "../define.js";

export default component({
  slug: "composer",
  title: "Composer",
  group: "fields",
  summary:
    "The message input of a chat: Enter sends, Shift+Enter adds a line, stop interrupts a reply.",
  analogy: "Like the typing line of a messaging app that also holds the stop button.",
  whenToUse:
    "Use it under Messages for any chat or assistant surface. For a one-off multi-line field use TextArea.",
  steps: {
    main: "Wrap ComposerInput in Composer and name the input with aria-label or a label.",
    supporting: "Add ComposerSend and, for model replies, ComposerStop.",
    behavior:
      "Handle onSend with the draft and set generating while the reply streams; stop shows up and sending pauses.",
    code: '<Composer onSend={send} onStop={stop} generating={generating}>\n  <ComposerInput aria-label="Message" />\n  <ComposerSend>Send</ComposerSend>\n  <ComposerStop>Stop</ComposerStop>\n</Composer>;',
  },
  imports: ["Composer", "ComposerInput", "ComposerSend", "ComposerStop"],
  snippet:
    '<Composer onSend={(text) => console.log(text)}><ComposerInput aria-label="Message" /><ComposerSend>Send</ComposerSend></Composer>',
  parts: [
    p("Composer", "root", "Native form that owns the draft.", true, false, [
      prop("value / defaultValue", "string", "Controlled or initial draft."),
      prop("onChange", "(value: string) => void", "Receives the next draft text."),
      prop(
        "onSend",
        "(value: string) => void",
        "Called with a non-empty draft; the draft is cleared afterwards. Native onSubmit still runs first and can veto.",
      ),
      prop("onStop", "() => void", "Called when the user stops the reply."),
      prop(
        "generating",
        "boolean",
        "A reply is being generated: sending pauses and ComposerStop appears.",
      ),
      prop("disabled", "boolean", "Disables the input and sending."),
      prop("as", "ElementType", "Renders another element in place of the form."),
    ]),
    p(
      "ComposerInput",
      "input",
      "The textarea; Enter sends unless Shift or Alt is held or an IME composition is active.",
    ),
    p(
      "ComposerSend",
      "trigger",
      "Submit button, disabled while the draft is empty or a reply is generating.",
    ),
    p("ComposerStop", "trigger", "Stop button; renders only while generating.", true, true),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Sends the draft." },
    { keys: ["Shift", "Enter"], action: "Inserts a new line." },
  ],
  stateHooks: [
    { attribute: "[data-generating]", on: "Composer", meaning: "A reply is being generated." },
  ],
  form: "The input submits as the field named message, so the form also works natively.",
  accessibility: [
    "Give ComposerInput an accessible name with aria-label or a Label.",
    "Enter that confirms an IME composition (Japanese, Chinese, Korean) never sends.",
    "Focus returns to the input after sending or stopping, so the next message can be typed at once.",
    "Announce when generation starts or ends with a Status or the Messages log, not by moving focus.",
  ],
  related: ["messages", "text-area", "suggestions"],
});
