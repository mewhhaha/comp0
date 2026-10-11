import { Alert, Separator, Status } from "@comp0/react";
import { type CatalogProps } from "../catalog/types.js";
import { alertProps, separatorProps } from "./feedback.props.js";
import { alertTones } from "./tokens.js";
import { asText, asToken } from "../safe.js";

export function AlertFacade({ message, tone, title }: CatalogProps<typeof alertProps>) {
  const resolved = asToken(tone, alertTones) ?? "info";
  const lead = asText(title);
  const content = (
    <>
      {lead === "" ? null : <strong data-slot="alert-title">{lead}</strong>}
      <span data-slot="alert-message">{asText(message)}</span>
    </>
  );
  // Warnings and errors interrupt; information and confirmations wait their turn.
  if (resolved === "warning" || resolved === "danger") {
    return <Alert data-tone={resolved}>{content}</Alert>;
  }
  return <Status data-tone={resolved}>{content}</Status>;
}

export function SeparatorFacade({ orientation }: CatalogProps<typeof separatorProps>) {
  return (
    <Separator
      data-slot="separator"
      orientation={asToken(orientation, ["horizontal", "vertical"] as const) ?? "horizontal"}
    />
  );
}

/** The facades that render the feedback components, by component name. */
export const feedbackComponents = {
  Alert: AlertFacade,
  Separator: SeparatorFacade,
};
