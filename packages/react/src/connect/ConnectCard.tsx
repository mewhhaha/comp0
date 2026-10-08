import { type ComponentProps, type KeyboardEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { ConnectCardContext, useConnectContext } from "./connect-shared.js";

export type ConnectCardProps = Omit<ComponentProps<"fieldset">, "value"> &
  AsProp & {
    value: string;
    label: string;
  };

export function ConnectCard({
  as,
  value,
  label,
  children,
  disabled = false,
  onKeyDown,
  ...props
}: ConnectCardProps) {
  const context = useConnectContext("ConnectCard");
  const Part = partElement(as, "fieldset");
  return (
    <ConnectCardContext value={{ value, label, disabled }}>
      <Part
        {...props}
        disabled={disabled}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={[props["aria-describedby"], context.instructionsId]
          .filter(Boolean)
          .join(" ")}
        tabIndex={props.tabIndex ?? 0}
        data-slot={dataSlot(props, "connect-card")}
        data-connect-card={value}
        onKeyDown={(event: KeyboardEvent<HTMLFieldSetElement>) => {
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
      </Part>
    </ConnectCardContext>
  );
}
