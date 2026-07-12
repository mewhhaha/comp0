import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  clampISODate,
  daysInMonth,
  formatISODate,
  isAfter,
  isBefore,
  isValidISODate,
  monthMatrix,
  parseISODate,
} from "./date.js";

describe("ISO parse and format", () => {
  it("round-trips a valid date through a UTC-noon Date", () => {
    const parsed = parseISODate("2024-02-29");
    expect(parsed).not.toBeNull();
    expect(parsed?.getUTCHours()).toBe(12);
    expect(formatISODate(parsed!)).toBe("2024-02-29");
  });

  it("rejects malformed and impossible dates", () => {
    expect(parseISODate("2024-2-9")).toBeNull();
    expect(parseISODate("2024-13-01")).toBeNull();
    expect(parseISODate("2023-02-29")).toBeNull();
    expect(parseISODate("2024-04-31")).toBeNull();
    expect(parseISODate("not-a-date")).toBeNull();
    expect(isValidISODate("2024-02-29")).toBe(true);
    expect(isValidISODate("2023-02-29")).toBe(false);
  });

  it("knows leap-year month lengths", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
  });
});

describe("date arithmetic", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("2024-01-15", 7)).toBe("2024-01-22");
  });

  it("clamps month-end days when adding months", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2023-01-31", 1)).toBe("2023-02-28");
    expect(addMonths("2024-03-31", -1)).toBe("2024-02-29");
    expect(addMonths("2024-05-31", 1)).toBe("2024-06-30");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
  });

  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2024-11-15", 3)).toBe("2025-02-15");
    expect(addMonths("2024-01-15", -2)).toBe("2023-11-15");
    expect(addMonths("2024-06-15", -18)).toBe("2022-12-15");
  });

  it("compares and clamps ISO dates", () => {
    expect(isBefore("2024-02-28", "2024-02-29")).toBe(true);
    expect(isBefore("2024-02-29", "2024-02-29")).toBe(false);
    expect(isAfter("2024-03-01", "2024-02-29")).toBe(true);
    expect(isAfter("2024-02-29", "2024-02-29")).toBe(false);
    expect(clampISODate("2024-02-05", "2024-02-10", "2024-02-20")).toBe("2024-02-10");
    expect(clampISODate("2024-02-25", "2024-02-10", "2024-02-20")).toBe("2024-02-20");
    expect(clampISODate("2024-02-15", "2024-02-10", "2024-02-20")).toBe("2024-02-15");
    expect(clampISODate("2024-02-15", undefined, undefined)).toBe("2024-02-15");
  });
});

describe("monthMatrix", () => {
  it("lays out leap-year February 2024 with a Monday start", () => {
    const weeks = monthMatrix("2024-02", 1);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]![0]).toEqual({ iso: "2024-01-29", outsideMonth: true });
    expect(weeks[0]![3]).toEqual({ iso: "2024-02-01", outsideMonth: false });
    expect(weeks[4]![3]).toEqual({ iso: "2024-02-29", outsideMonth: false });
    expect(weeks[4]![6]).toEqual({ iso: "2024-03-03", outsideMonth: true });
    const inside = weeks.flat().filter((cell) => !cell.outsideMonth);
    expect(inside).toHaveLength(29);
    expect(inside[0]?.iso).toBe("2024-02-01");
    expect(inside.at(-1)?.iso).toBe("2024-02-29");
  });

  it("lays out February 2024 with a Sunday start", () => {
    const weeks = monthMatrix("2024-02", 7);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toEqual({ iso: "2024-01-28", outsideMonth: true });
    expect(weeks[0]![4]).toEqual({ iso: "2024-02-01", outsideMonth: false });
    expect(weeks[4]![6]).toEqual({ iso: "2024-03-02", outsideMonth: true });
  });

  it("starts flush without leading cells when the month begins on the week start", () => {
    // April 2024 begins on a Monday.
    const weeks = monthMatrix("2024-04", 1);
    expect(weeks[0]![0]).toEqual({ iso: "2024-04-01", outsideMonth: false });
    expect(weeks).toHaveLength(5);
    expect(weeks[4]![6]).toEqual({ iso: "2024-05-05", outsideMonth: true });
  });

  it("returns nothing for malformed months", () => {
    expect(monthMatrix("2024-2", 1)).toEqual([]);
    expect(monthMatrix("2024-13", 1)).toEqual([]);
  });
});
