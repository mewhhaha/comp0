import { useState } from "react";
import { Button, CopyButton, Link, Suggestion, Suggestions } from "@comp0/react";
import { useFormSnapshot } from "../bridge/fields.js";
import { useActionSteps, type ActionStep } from "../bridge/steps.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import { buttonProps, linkProps, suggestionsProps, copyButtonProps } from "./actions.props.js";
import { variants } from "./tokens.js";
import { useGenUI } from "../render/context.js";
import { asRecords, asStrings, asText, asToken, safeHref } from "../safe.js";

export function ButtonFacade({
  label,
  variant,
  message,
  action,
}: CatalogProps<typeof buttonProps>) {
  const { act, streaming } = useGenUI();
  const snapshot = useFormSnapshot();
  const runSteps = useActionSteps();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const text = asText(label);
  const sentence = asText(message).trim() === "" ? text : asText(message);
  const steps = asRecords(action) as ActionStep[];
  let failure = null;
  if (error !== "") {
    failure = (
      <p data-slot="button-error" role="alert">
        {error}
      </p>
    );
  }
  return (
    <>
      <Button
        data-slot="button"
        data-variant={asToken(variant, variants)}
        // Pressing a button during streaming would act on a half-written interface.
        disabled={streaming || pending || text === ""}
        aria-busy={pending || undefined}
        onClick={() => {
          // Inside a form the button also reports what the person has filled in so far.
          const { name, values } = snapshot();
          if (steps.length === 0) {
            act({ type: "button", name, message: sentence, values });
            return;
          }
          setPending(true);
          setError("");
          void runSteps(steps, { type: "button", name, values }).then((result) => {
            setPending(false);
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {text}
      </Button>
      {failure}
    </>
  );
}

export function LinkFacade({ label, href }: CatalogProps<typeof linkProps>) {
  const text = asText(label);
  const safe = safeHref(href);
  // Without a safe target (or while it is still streaming) the text stays but is not a link.
  if (safe === undefined) return <span data-slot="link">{text}</span>;
  const external = /^https?:/i.test(safe);
  return (
    <Link data-slot="link" href={safe} rel={external ? "noopener noreferrer" : undefined}>
      {text}
    </Link>
  );
}

export function SuggestionsFacade({ label, items }: CatalogProps<typeof suggestionsProps>) {
  const { act, streaming } = useGenUI();
  const replies = asStrings(items, 12).filter((item) => item.trim() !== "");
  if (replies.length === 0) return null;
  return (
    <Suggestions
      aria-label={asText(label)}
      // Sending a half-written reply would act on an unfinished interface.
      disabled={streaming}
      onSend={(reply) => {
        act({ type: "suggestion", message: reply });
      }}
    >
      {replies.map((reply, index) => (
        <Suggestion key={index} value={reply}>
          {reply}
        </Suggestion>
      ))}
    </Suggestions>
  );
}

export function CopyButtonFacade({ label, value }: CatalogProps<typeof copyButtonProps>) {
  const { streaming } = useGenUI();
  const text = asText(label);
  const copied = asText(value);
  return (
    <CopyButton
      data-slot="copy-button"
      value={copied}
      disabled={streaming || text === "" || copied === ""}
    >
      {text}
    </CopyButton>
  );
}

export const actionEntries = [
  defineEntry({
    name: "Button",
    group: "Actions",
    description:
      'A button that sends a message back to the assistant when pressed, for choices and next steps ("Show details", "Book it"). Inside a Form it sends that form\'s values. Requires a label that says what it does.',
    props: buttonProps,
    component: ButtonFacade,
  }),
  defineEntry({
    name: "Link",
    group: "Actions",
    description:
      "A link to a web page, email address, phone number, or section. Requires label text and an http(s), mailto:, tel:, relative, or #fragment href; other URLs are not linked.",
    props: linkProps,
    component: LinkFacade,
  }),
  defineEntry({
    name: "Suggestions",
    group: "Actions",
    description:
      "Quick replies for likely next steps. Pressing one sends its text as the person's next message. Requires a label for the group and the list of replies; keep them short and few.",
    props: suggestionsProps,
    component: SuggestionsFacade,
  }),
  defineEntry({
    name: "CopyButton",
    group: "Actions",
    description:
      "A button that copies text to the clipboard, such as a code snippet, command, or address. Show the text itself nearby, since the person cannot see what is copied. Requires a label that says what is copied and the value.",
    props: copyButtonProps,
    component: CopyButtonFacade,
  }),
];
