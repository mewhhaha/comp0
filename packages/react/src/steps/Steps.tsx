import { useId, useLayoutEffect, useState, type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { StepsContext } from "./steps-shared.js";

export type StepsProps = RootProps<{
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next step value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Steps({ as, children, value, defaultValue, onChange, ...props }: StepsProps) {
  const baseId = useId();
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const collection = useCollection();
  const [order, setOrder] = useState<string[]>([]);

  // Items register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncOrder = () => {
      setOrder((previous) => {
        const next = collection.items().map((item) => item.key);
        if (
          next.length === previous.length &&
          next.every((entry, index) => entry === previous[index])
        ) {
          return previous;
        }
        return next;
      });
    };
    syncOrder();
    return collection.subscribe(syncOrder);
  }, [collection]);

  const Root = rootElement(as);
  return (
    <StepsContext value={{ baseId, currentValue, order, setCurrentValue, collection }}>
      <Root data-slot="steps" {...props}>
        {children}
      </Root>
    </StepsContext>
  );
}
