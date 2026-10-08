/**
 * Keeps controlled `popover="auto"` surfaces consistent with their owners.
 * Native auto popovers close each other and light dismiss on outside clicks;
 * the coordinator re-opens a surface whose owner still wants it open once the
 * conflicting popover settles, ordering conflicts by most recent open.
 */

export type PopoverSurfaceElement = HTMLElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

export type CoordinatedAutoPopover = {
  coordinator: AutoPopoverCoordinator;
  desiredOpen: () => boolean;
  element: PopoverSurfaceElement;
  opening: "prioritized" | "restoring" | null;
  pending: boolean;
  priority: number;
};

type AutoPopoverCoordinator = {
  document: Document;
  entries: Set<CoordinatedAutoPopover>;
  nextPriority: number;
  onToggle: () => void;
  timer: ReturnType<typeof setTimeout> | undefined;
};

const autoPopoverCoordinators = new WeakMap<Document, AutoPopoverCoordinator>();

function areNestedPopovers(first: HTMLElement, second: HTMLElement) {
  return first.contains(second) || second.contains(first);
}

export function scheduleAutoPopoverFlush(coordinator: AutoPopoverCoordinator) {
  if (coordinator.timer !== undefined) return;
  coordinator.timer = setTimeout(() => {
    coordinator.timer = undefined;
    flushAutoPopoverCoordinator(coordinator);
  });
}

function flushAutoPopoverCoordinator(coordinator: AutoPopoverCoordinator) {
  const entriesByElement = new Map(
    Array.from(coordinator.entries, (entry) => [entry.element, entry] as const),
  );
  for (const entry of coordinator.entries) {
    if (!entry.element.isConnected || !entry.desiredOpen()) entry.pending = false;
    if (entry.element.matches(":popover-open")) entry.pending = false;
  }

  const candidates = Array.from(coordinator.entries)
    .filter(
      (entry) =>
        entry.pending &&
        entry.desiredOpen() &&
        entry.element.isConnected &&
        !entry.element.matches(":popover-open"),
    )
    .sort((first, second) => second.priority - first.priority);

  for (const candidate of candidates) {
    const openAutoPopovers = candidate.element.ownerDocument.querySelectorAll<HTMLElement>(
      '[popover="auto"]:popover-open',
    );
    let blocked = false;
    for (const openElement of openAutoPopovers) {
      if (openElement === candidate.element || areNestedPopovers(openElement, candidate.element))
        continue;
      const openEntry = entriesByElement.get(openElement);
      if (!openEntry || (openEntry.desiredOpen() && openEntry.priority > candidate.priority)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    candidate.opening = "restoring";
    candidate.pending = false;
    try {
      candidate.element.showPopover?.();
    } catch {
      candidate.opening = null;
      candidate.pending = candidate.desiredOpen();
      continue;
    }
    scheduleAutoPopoverFlush(coordinator);
    return;
  }
}

function getAutoPopoverCoordinator(document: Document) {
  const existing = autoPopoverCoordinators.get(document);
  if (existing) return existing;

  const coordinator: AutoPopoverCoordinator = {
    document,
    entries: new Set(),
    nextPriority: 0,
    onToggle() {
      scheduleAutoPopoverFlush(coordinator);
    },
    timer: undefined,
  };
  document.addEventListener("toggle", coordinator.onToggle, true);
  autoPopoverCoordinators.set(document, coordinator);
  return coordinator;
}

export function registerAutoPopover(element: PopoverSurfaceElement, desiredOpen: () => boolean) {
  const coordinator = getAutoPopoverCoordinator(element.ownerDocument);
  const entry: CoordinatedAutoPopover = {
    coordinator,
    desiredOpen,
    element,
    opening: null,
    pending: false,
    priority: 0,
  };
  coordinator.entries.add(entry);
  return entry;
}

export function unregisterAutoPopover(entry: CoordinatedAutoPopover) {
  const { coordinator } = entry;
  coordinator.entries.delete(entry);
  if (coordinator.entries.size) {
    scheduleAutoPopoverFlush(coordinator);
    return;
  }

  clearTimeout(coordinator.timer);
  coordinator.document.removeEventListener("toggle", coordinator.onToggle, true);
  autoPopoverCoordinators.delete(coordinator.document);
}

export function prioritizeAutoPopover(entry: CoordinatedAutoPopover) {
  entry.opening = "prioritized";
  entry.pending = false;
  entry.priority = ++entry.coordinator.nextPriority;
}

export function noteAutoPopoverToggle(entry: CoordinatedAutoPopover, open: boolean) {
  if (open) {
    if (!entry.opening) entry.priority = ++entry.coordinator.nextPriority;
    entry.opening = null;
    entry.pending = false;
  } else {
    entry.opening = null;
    entry.pending = entry.desiredOpen();
  }
  scheduleAutoPopoverFlush(entry.coordinator);
}
