import { type FieldsetHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ConnectCardContext, useConnectContext } from "./connect-shared.js";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- The native fieldset offers optional card navigation without changing descendant control keys. */

export type ConnectCardProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  value: string;
  label: string;
};

export function ConnectCard({
  value,
  label,
  children,
  disabled = false,
  onKeyDown,
  ref,
  ...props
}: ConnectCardProps & RefProp<HTMLFieldSetElement>) {
  const context = useConnectContext("ConnectCard");
  return (
    <ConnectCardContext value={{ value, label, disabled }}>
      <fieldset
        {...props}
        ref={ref}
        disabled={disabled}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={[props["aria-describedby"], context.instructionsId]
          .filter(Boolean)
          .join(" ")}
        tabIndex={props.tabIndex ?? 0}
        data-slot={dataSlot(props, "connect-card")}
        data-connect-card={value}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return;
          const cards = Array.from(
            context.element?.querySelectorAll<HTMLFieldSetElement>("[data-connect-card]") ?? [],
          ).filter((card) => card.closest("[data-connect-root]") === context.element);
          const index = cards.indexOf(event.currentTarget);
          let next = index;
          if (event.key === "ArrowDown") next = Math.min(index + 1, cards.length - 1);
          else if (event.key === "ArrowUp") next = Math.max(index - 1, 0);
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = cards.length - 1;
          else return;
          event.preventDefault();
          cards[next]?.focus();
        }}
      >
        {children}
      </fieldset>
    </ConnectCardContext>
  );
}
