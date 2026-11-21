import { useId, useState, type ReactNode } from "react";
import { useControllableState } from "@comp0/core";
import { useCollectionPass } from "../internal/collection-pass.js";
import { createOrderedCollection } from "../internal/ordered-collection.js";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { createStepsSeed, createStepsStatus, StepsContext } from "./steps-shared.js";

export type StepsProps = RootProps<{
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next step value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  children?: ReactNode | undefined;
}>;

export function Steps({ as, children, value, defaultValue, onChange, ...props }: StepsProps) {
  const baseId = useId();
  const initialValue = defaultValue ?? "";
  const [, setCurrentValue, { controlled }] = useControllableState({
    value,
    defaultValue: initialValue,
    onChange,
  });
  const [seed] = useState(createStepsSeed);
  // The seed answers only server and hydration renders, so the store never needs to clear it.
  const [items] = useState(() => createOrderedCollection());
  // The store mirrors the uncontrolled value: it starts from the same default and is written only
  // in the event that sets that state, so dropping `value` later shows it in the same render.
  const [status] = useState(() => createStepsStatus(items, seed, initialValue));

  // Uncontrolled moves update the status in the same event as the state, so they take one commit;
  // a controlled value waits for its owner, which may reject the change, and reaches the parts
  // through context in the render that commits it.
  const select = (next: string) => {
    setCurrentValue(next);
    if (!controlled) status.setCurrent(next);
  };

  const pass = useCollectionPass(seed, children);
  const Root = rootElement(as);
  return (
    <StepsContext value={{ baseId, select, items, seed, status, value }}>
      {pass}
      <Root data-comp0="steps" {...props}>
        {children}
      </Root>
    </StepsContext>
  );
}
