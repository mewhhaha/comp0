import { component, p, prop } from "../define.js";

export default component({
  slug: "message",
  title: "Message",
  group: "navigation",
  summary: "One chat message with its author, time, content, and streaming status.",
  analogy:
    "Like a single bubble in a conversation, with a tag saying whether it is still being typed.",
  whenToUse:
    "Use it for each entry inside Messages, especially when a reply streams in. A plain article is enough for static transcripts.",
  steps: {
    main: "Render one Message per entry inside Messages and set from to user, assistant, or system.",
    supporting:
      "Add MessageAuthor, MessageTime with a machine-readable dateTime, and MessageContent.",
    behavior:
      "Set status to streaming while content arrives, then complete or error. Set busy on Messages too so the log announces the message once.",
    code: '<Messages aria-label="Conversation" busy={streaming}>\n  <Message from="assistant" status={streaming ? "streaming" : "complete"}>\n    <MessageAuthor>Assistant</MessageAuthor>\n    <MessageContent>{reply}</MessageContent>\n  </Message>\n</Messages>;',
  },
  imports: ["Message", "MessageAuthor", "MessageContent", "MessageTime"],
  snippet:
    '<Message from="assistant"><MessageAuthor>Assistant</MessageAuthor><MessageTime dateTime="2026-10-09T10:00:00Z">10:00</MessageTime><MessageContent>Here is your summary.</MessageContent></Message>',
  parts: [
    p(
      "Message",
      "root",
      "Article for one message; busy while its status is streaming.",
      true,
      false,
      [
        prop(
          "from",
          '"user" | "assistant" | "system"',
          "Who wrote it; exposed as data-from for styling.",
        ),
        prop(
          "status",
          '"streaming" | "complete" | "error"',
          "Streaming sets aria-busy and makes nested comp0 parts hold warnings and focus moves.",
        ),
        prop("as", "ElementType", "Renders another element in place of the article."),
      ],
    ),
    p("MessageAuthor", "label", "Visible name of the author."),
    p("MessageTime", "value", "Time element for when it was sent."),
    p("MessageContent", "region", "Body of the message."),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-busy]",
      on: "Message",
      meaning: "The message is streaming, or an ancestor is busy.",
    },
    { attribute: "[data-status]", on: "Message", meaning: "streaming, complete, or error." },
    { attribute: "[data-from]", on: "Message", meaning: "user, assistant, or system." },
  ],
  form: "Message creates no form values.",
  accessibility: [
    "A streaming message is aria-busy so assistive technology waits for the finished text; also set busy on the enclosing Messages.",
    "Keep the author name visible; never rely on alignment or color to show who is speaking.",
    "Show an error as text, not only a color, and offer a retry control after it.",
  ],
  related: ["messages", "composer", "reasoning"],
});
