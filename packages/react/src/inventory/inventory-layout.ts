export type InventoryLayoutEntry = {
  value: string;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
};

export type InventoryLayout = InventoryLayoutEntry[];

export type InventoryInteraction = "move" | "resize";

export type InventoryUpdate = {
  entry: InventoryLayoutEntry;
  status: "changed" | "invalid" | "unchanged";
  /** The complete next layout; present when `status` is "changed". */
  layout?: InventoryLayout | undefined;
};

export function overlaps(first: InventoryLayoutEntry, second: InventoryLayoutEntry) {
  return (
    first.column < second.column + second.columnSpan &&
    first.column + first.columnSpan > second.column &&
    first.row < second.row + second.rowSpan &&
    first.row + first.rowSpan > second.row
  );
}

export function fits(entry: InventoryLayoutEntry, columns: number, rows: number) {
  return (
    entry.column >= 1 &&
    entry.row >= 1 &&
    entry.column + entry.columnSpan - 1 <= columns &&
    entry.row + entry.rowSpan - 1 <= rows
  );
}

function firstAvailablePosition(
  entry: InventoryLayoutEntry,
  occupied: InventoryLayoutEntry[],
  columns: number,
  rows: number,
) {
  const firstIndex = (entry.row - 1) * columns + entry.column - 1;
  for (let index = firstIndex; index < columns * rows; index += 1) {
    const candidate = {
      ...entry,
      column: (index % columns) + 1,
      row: Math.floor(index / columns) + 1,
    };
    if (!fits(candidate, columns, rows)) continue;
    if (!occupied.some((placed) => overlaps(candidate, placed))) return candidate;
  }
  return undefined;
}

export function resolveInventoryLayout(
  layout: InventoryLayout,
  value: string,
  proposed: InventoryLayoutEntry,
  columns: number,
  rows: number,
) {
  if (!fits(proposed, columns, rows)) return undefined;
  const resolved = new Map<string, InventoryLayoutEntry>([[value, proposed]]);
  const occupied = [proposed];
  const remaining = layout
    .filter((entry) => entry.value !== value)
    .sort((first, second) => first.row - second.row || first.column - second.column);

  for (const entry of remaining) {
    let next = entry;
    if (occupied.some((placed) => overlaps(next, placed))) {
      const available = firstAvailablePosition(entry, occupied, columns, rows);
      if (!available) return undefined;
      next = available;
    }
    occupied.push(next);
    resolved.set(next.value, next);
  }

  return layout.map((entry) => resolved.get(entry.value) ?? entry);
}

export type InventoryLayoutProblem = {
  /** Unique per bad entry so each warns once. */
  key: string;
  message: string;
};

function positiveInteger(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

/**
 * Validates runtime layout data without throwing: invalid or conflicting
 * entries are skipped (the earlier of two conflicting entries wins) and a bad
 * grid size is clamped to a positive integer. The same result is used in
 * development and production; callers report `problems`.
 */
export function sanitizeInventoryLayout(layout: InventoryLayout, columns: number, rows: number) {
  const problems: InventoryLayoutProblem[] = [];
  if (!Number.isInteger(columns) || columns < 1) {
    problems.push({
      key: `Inventory:columns:${columns}`,
      message: `Inventory columns must be a positive integer; received ${columns}. It was clamped.`,
    });
  }
  if (!Number.isInteger(rows) || rows < 1) {
    problems.push({
      key: `Inventory:rows:${rows}`,
      message: `Inventory rows must be a positive integer; received ${rows}. It was clamped.`,
    });
  }
  const safeColumns = positiveInteger(columns);
  const safeRows = positiveInteger(rows);

  const kept: InventoryLayout = [];
  const seen = new Set<string>();
  for (const entry of layout) {
    if (seen.has(entry.value)) {
      problems.push({
        key: `Inventory:duplicate:${entry.value}`,
        message: `Inventory layout value "${entry.value}" appears more than once. The later entry was skipped.`,
      });
      continue;
    }
    seen.add(entry.value);
    const invalid = (
      [
        ["column", entry.column],
        ["row", entry.row],
        ["columnSpan", entry.columnSpan],
        ["rowSpan", entry.rowSpan],
      ] as const
    ).find(([, value]) => !Number.isInteger(value) || value < 1);
    if (invalid) {
      problems.push({
        key: `Inventory:invalid:${entry.value}:${invalid[0]}`,
        message: `Inventory layout value "${entry.value}" has ${invalid[0]} ${invalid[1]}; expected a positive integer. It was skipped.`,
      });
      continue;
    }
    if (!fits(entry, safeColumns, safeRows)) {
      problems.push({
        key: `Inventory:bounds:${entry.value}`,
        message: `Inventory layout value "${entry.value}" at column ${entry.column}, row ${entry.row} with span ${entry.columnSpan}×${entry.rowSpan} exceeds the ${safeColumns}×${safeRows} inventory. It was skipped.`,
      });
      continue;
    }
    const conflict = kept.find((other) => overlaps(entry, other));
    if (conflict) {
      problems.push({
        key: `Inventory:overlap:${conflict.value}:${entry.value}`,
        message: `Inventory layout values "${conflict.value}" and "${entry.value}" overlap. "${entry.value}" was skipped.`,
      });
      continue;
    }
    kept.push(entry);
  }
  return { layout: kept, columns: safeColumns, rows: safeRows, problems };
}

export function hasSamePlacement(first: InventoryLayoutEntry, second: InventoryLayoutEntry) {
  return (
    first.column === second.column &&
    first.row === second.row &&
    first.columnSpan === second.columnSpan &&
    first.rowSpan === second.rowSpan
  );
}

/** Applies a grid-unit delta: a move shifts the origin, a resize changes the spans. */
export function stepInventoryEntry(
  entry: InventoryLayoutEntry,
  interaction: InventoryInteraction,
  columnDelta: number,
  rowDelta: number,
): InventoryLayoutEntry {
  if (interaction === "move") {
    return { ...entry, column: entry.column + columnDelta, row: entry.row + rowDelta };
  }
  return {
    ...entry,
    columnSpan: entry.columnSpan + columnDelta,
    rowSpan: entry.rowSpan + rowDelta,
  };
}

/** Clamps a proposed entry to the grid: moves keep their spans, resizes keep their origin. */
export function constrainInventoryEntry(
  proposed: InventoryLayoutEntry,
  interaction: InventoryInteraction,
  columns: number,
  rows: number,
): InventoryLayoutEntry {
  if (interaction === "move") {
    return {
      ...proposed,
      column: Math.min(Math.max(1, proposed.column), columns - proposed.columnSpan + 1),
      row: Math.min(Math.max(1, proposed.row), rows - proposed.rowSpan + 1),
    };
  }
  return {
    ...proposed,
    columnSpan: Math.min(Math.max(1, proposed.columnSpan), columns - proposed.column + 1),
    rowSpan: Math.min(Math.max(1, proposed.rowSpan), rows - proposed.row + 1),
  };
}

export type InventoryChange = {
  layout: InventoryLayout;
  value: string;
  interaction: InventoryInteraction;
  columns: number;
  rows: number;
  /** Derives the proposed entry from the item's entry in `layout`. */
  change: (entry: InventoryLayoutEntry) => InventoryLayoutEntry;
  /** Vetoes the complete resolved layout. */
  canChange?: ((layout: InventoryLayout, changedValue: string) => boolean) | undefined;
};

/**
 * Resolves a proposed move or resize against the layout: clamps it to the grid,
 * pushes obstructing items forward, and reports whether it changed, was
 * rejected, or left the item where it was. Returns undefined for an unknown item.
 */
export function proposeInventoryChange(request: InventoryChange): InventoryUpdate | undefined {
  const { layout, value, interaction, columns, rows, canChange } = request;
  const current = layout.find((entry) => entry.value === value);
  if (!current) return undefined;
  const constrained = constrainInventoryEntry(request.change(current), interaction, columns, rows);
  if (hasSamePlacement(constrained, current)) return { entry: constrained, status: "unchanged" };
  const resolved = resolveInventoryLayout(layout, value, constrained, columns, rows);
  if (!resolved || (canChange && !canChange(resolved, value))) {
    return { entry: constrained, status: "invalid" };
  }
  const entry = resolved.find((candidate) => candidate.value === value);
  return entry ? { entry, status: "changed", layout: resolved } : undefined;
}

/** The grid-unit delta an arrow key requests, or undefined for any other key. */
export function inventoryKeyDelta(key: string) {
  if (key === "ArrowLeft") return { column: -1, row: 0 };
  if (key === "ArrowRight") return { column: 1, row: 0 };
  if (key === "ArrowUp") return { column: 0, row: -1 };
  if (key === "ArrowDown") return { column: 0, row: 1 };
  return undefined;
}

export type InventoryTrackMetrics = {
  /** Content-box size of the grid, without padding. */
  width: number;
  height: number;
  columnGap: number;
  rowGap: number;
};

/** Pixels per grid step (track plus gap) on each axis, or undefined for a collapsed grid. */
export function inventoryTrackSteps(metrics: InventoryTrackMetrics, columns: number, rows: number) {
  const columnSize = (metrics.width - metrics.columnGap * (columns - 1)) / columns;
  const rowSize = (metrics.height - metrics.rowGap * (rows - 1)) / rows;
  if (columnSize <= 0 || rowSize <= 0) return undefined;
  return { columnStep: columnSize + metrics.columnGap, rowStep: rowSize + metrics.rowGap };
}

/** Whole grid steps covered by a pointer displacement. */
export function inventoryPointerDelta(
  displacement: { x: number; y: number },
  steps: { columnStep: number; rowStep: number },
) {
  return {
    column: Math.round(displacement.x / steps.columnStep),
    row: Math.round(displacement.y / steps.rowStep),
  };
}

export function inventoryAnnouncement(
  kind: "start" | "result" | "invalid" | "cancel",
  interaction: InventoryInteraction,
  label: string,
  entry?: InventoryLayoutEntry,
) {
  if (kind === "start") {
    const action = interaction === "move" ? "Moving" : "Resizing";
    return `${action} ${label}. Use the arrow keys to make changes, Enter to finish, Escape to cancel.`;
  }
  if (kind === "invalid") return `${label} cannot fit there.`;
  if (kind === "cancel") return `${label} change cancelled.`;
  if (!entry) return "";
  if (interaction === "move") return `${label} moved to column ${entry.column}, row ${entry.row}.`;
  return `${label} resized to ${entry.columnSpan} columns by ${entry.rowSpan} rows.`;
}
