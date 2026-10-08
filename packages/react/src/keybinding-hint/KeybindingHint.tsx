import { useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

const keyLabels: Record<string, string> = {
  Alt: "Alt",
  ArrowDown: "Down Arrow",
  ArrowLeft: "Left Arrow",
  ArrowRight: "Right Arrow",
  ArrowUp: "Up Arrow",
  Control: "Control",
  Enter: "Enter",
  Escape: "Escape",
  Meta: "Command",
  Shift: "Shift",
  Space: "Space",
};

const subscribeToPlatform = () => () => {};

function modifierKey(): "Control" | "Meta" {
  if (typeof navigator === "undefined") return "Control";
  return /Macintosh|Mac OS X|iPhone|iPad|iPod/.test(navigator.userAgent) ? "Meta" : "Control";
}

export type KeybindingHintProps = Omit<ComponentProps<"span">, "children"> &
  AsProp & {
    /** Chords joined by + and sequential chords separated by spaces. */
    keys: string;
  };

/** A visible, semantic hint for keyboard behavior implemented elsewhere. */
export function KeybindingHint({ as, keys, ...props }: KeybindingHintProps) {
  const resolvedModifierKey = useSyncExternalStore(
    subscribeToPlatform,
    modifierKey,
    () => "Control",
  );
  const chords = keys.trim().split(/\s+/).filter(Boolean);
  const spokenLabel = chords
    .map((chord) =>
      chord
        .split("+")
        .filter(Boolean)
        .map((key) => keyLabels[key === "Mod" ? resolvedModifierKey : key] ?? key)
        .join(" plus "),
    )
    .join(", then ");
  const content: ReactNode[] = [];
  chords.forEach((chord, chordIndex) => {
    if (chordIndex > 0) {
      content.push(
        <span key={`then-${chordIndex}`} aria-hidden="true" data-slot="keybinding-separator">
          then
        </span>,
      );
    }
    chord
      .split("+")
      .filter(Boolean)
      .forEach((key, keyIndex) => {
        let visibleKey = keyLabels[key] ?? key;
        if (key === "Mod") visibleKey = resolvedModifierKey === "Meta" ? "⌘" : "Ctrl";
        if (keyIndex > 0) {
          content.push(
            <span key={`plus-${chordIndex}-${keyIndex}`} aria-hidden="true">
              +
            </span>,
          );
        }
        content.push(
          <kbd
            key={`${chordIndex}-${keyIndex}-${key}`}
            aria-hidden="true"
            data-slot="keybinding-key"
          >
            {visibleKey}
          </kbd>,
        );
      });
  });

  const Part = partElement(as, "span");
  return (
    <Part
      {...props}
      aria-label={props["aria-label"] ?? spokenLabel}
      data-slot={dataSlot(props, "keybinding-hint")}
    >
      {content}
    </Part>
  );
}
