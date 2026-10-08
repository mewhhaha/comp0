/** Live-region messages for GridList and GridListReorderGroup moves. */
export const gridListMessages = {
  started: (label: string) =>
    `Moving ${label}. Use the arrow keys to choose a position, Enter to drop, Escape to cancel.`,
  moving: (label: string, position: number, total: number) =>
    `Moving ${label} to position ${position} of ${total}.`,
  moved: (label: string, position: number, total: number) =>
    `Moved ${label} to position ${position} of ${total}.`,
  blocked: (label: string) => `Cannot move ${label} there.`,
  cancelled: (label: string) => `Cancelled moving ${label}.`,
  movingToList: (label: string, list: string, position: number, total: number) =>
    `Moving ${label} to ${list}, position ${position} of ${total}.`,
  movedToList: (label: string, list: string, position: number, total: number) =>
    `Moved ${label} to ${list}, position ${position} of ${total}.`,
  blockedToList: (label: string, list: string) => `Cannot move ${label} to ${list}.`,
};
