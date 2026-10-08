import { useLayoutEffect, useState, type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs, useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
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
  ref,
  ...props
}: ConnectCardProps) {
  const context = useConnectContext("ConnectCard");
  const navigate = useCollectionNavigation();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const { cards } = context;
  useLayoutEffect(() => {
    if (!element) return;
    cards.register({ key: value, textValue: label, element });
    return () => {
      cards.unregister(value, element);
    };
  }, [cards, value, label, element]);
  const Part = partElement(as, "fieldset");
  return (
    <ConnectCardContext value={{ value, label, disabled }}>
      <Part
        data-slot="connect-card"
        {...props}
        ref={composeRefs(ref, setElement)}
        disabled={disabled}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={[props["aria-describedby"], context.instructionsId]
          .filter(Boolean)
          .join(" ")}
        tabIndex={props.tabIndex ?? 0}
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
          const target = navigate(event.key, cards.items(), value, {
            orientation: "vertical",
            typeahead: false,
          });
          if (target === undefined) return;
          event.preventDefault();
          cards.get(target)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </ConnectCardContext>
  );
}
