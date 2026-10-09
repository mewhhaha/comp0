import { createContext, use, useEffect } from "react";

/**
 * True while an ancestor marks its content as still being assembled, such as
 * a model-generated answer that is streaming in. Parts read it to hold back
 * data warnings and focus moves until the content settles.
 */
export const BusyContext = createContext(false);
BusyContext.displayName = "BusyContext";

/** Whether the nearest content is still being assembled. */
export function useBusy(): boolean {
  return use(BusyContext);
}

const userInputEvents = [
  "click",
  "dblclick",
  "contextmenu",
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "touchstart",
  "touchend",
  "keydown",
  "keyup",
  "beforeinput",
  "input",
  "change",
  "submit",
];

const trackedDocuments = new WeakSet<Document>();
let handlingUserInput = false;

function markUserInput() {
  handlingUserInput = true;
  // A user's input and the updates its handlers flush share one event-loop turn.
  // Anything that arrives later, such as a streamed chunk, is not a response to it.
  setTimeout(() => {
    handlingUserInput = false;
  }, 0);
}

/**
 * Starts noting user input on `ownerDocument` so parts can tell a surface the
 * user just opened from content that opened on its own. Busy regions call it
 * when they mount; it is idempotent and listens passively in the capture phase.
 */
export function trackUserInput(ownerDocument: Document = document) {
  if (trackedDocuments.has(ownerDocument)) return;
  trackedDocuments.add(ownerDocument);
  for (const type of userInputEvents) {
    ownerDocument.addEventListener(type, markUserInput, { capture: true, passive: true });
  }
}

/**
 * Whether a part may move focus on its own, such as to a surface that just
 * opened. Nothing moves focus inside a busy region unless the user just asked
 * for it: user input moves focus as usual, while content that arrives or opens
 * on its own leaves focus where it is.
 */
export function mayMoveFocus(busy: boolean): boolean {
  return !busy || handlingUserInput;
}

/**
 * Resolves whether a region is busy (its own flag or any ancestor's) and keeps
 * user input tracked so its parts can tell the user's own actions apart.
 */
export function useBusyRegion(busy: boolean | undefined): boolean {
  const parentBusy = useBusy();
  useEffect(() => {
    trackUserInput();
  }, []);
  return Boolean(busy) || parentBusy;
}
