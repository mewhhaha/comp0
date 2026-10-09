import { component, p, prop } from "../define.js";

export default component({
  slug: "messages",
  title: "Messages",
  group: "navigation",
  summary: "A named message history that politely announces new messages appended at the end.",
  analogy: "Like a conversation transcript whose newest line is read aloud without interrupting.",
  whenToUse:
    "Use it for an ongoing chat or messaging history; use Feed for scroll-loaded articles.",
  steps: {
    main: "Add Messages with an aria-label or aria-labelledby.",
    supporting: "Append each complete message at the end, with visible sender and time context.",
    behavior:
      "Keep the composer outside the history and set busy while a streamed message is being assembled.",
    code: '<Messages aria-label="Conversation with Ada">\n  <p>Ada: Hello.</p>\n</Messages>;',
  },
  imports: ["Button", "Label", "Messages", "TextArea", "TextField"],
  snippet:
    '<section aria-labelledby="chat-title"><h2 id="chat-title">Conversation with Ada</h2><Messages aria-labelledby="chat-title"><p>Ada: Hello.</p></Messages><form><TextField><Label>Message</Label><TextArea name="message" /></TextField><Button type="submit">Send</Button></form></section>',
  parts: [
    p(
      "Messages",
      "root",
      "Chronological message log with implicit polite live announcements.",
      true,
      false,
      [
        prop(
          "aria-label / aria-labelledby",
          "string",
          "Names the conversation history for assistive technology.",
        ),
        prop(
          "busy",
          "boolean",
          "Defers live-region processing while a message is being assembled.",
        ),
        prop(
          "aria-live",
          '"off" | "polite" | "assertive"',
          "Native override; use off temporarily while prepending older messages.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-busy]",
      on: "Messages",
      meaning: "A message is still being assembled before announcement.",
    },
  ],
  form: "Messages does not create form values; keep the message composer beside it, not inside it.",
  accessibility: [
    "Give the history an aria-label or aria-labelledby so its polite live region has a useful name.",
    "Append completed messages at the end; when prepending older history, temporarily set aria-live to off so old messages are not announced as new.",
    "Keep the message composer outside Messages, and do not move focus when a message arrives.",
  ],
  related: ["message", "composer", "feed", "toast"],
  moreExamples: [
    {
      id: "assistant",
      title: "Assistant chat",
      description:
        "Messages, Message, Reasoning, Suggestions, Composer, Feedback, and CopyButton working together on a fake streamed reply.",
    },
    {
      id: "streaming",
      title: "Streaming response",
      description:
        "Keep visible response text moving while aria-busy defers the live log until the complete or interrupted response is ready to announce.",
    },
  ],
});
