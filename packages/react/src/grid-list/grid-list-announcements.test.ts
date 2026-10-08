import { describe, expect, it } from "vitest";
import { gridListMessages } from "./grid-list-announcements.js";

describe("gridListMessages", () => {
  it("describes moves within one list", () => {
    expect(gridListMessages.started("Report")).toBe(
      "Moving Report. Use the arrow keys to choose a position, Enter to drop, Escape to cancel.",
    );
    expect(gridListMessages.moving("Report", 2, 3)).toBe("Moving Report to position 2 of 3.");
    expect(gridListMessages.moved("Report", 2, 3)).toBe("Moved Report to position 2 of 3.");
    expect(gridListMessages.blocked("Report")).toBe("Cannot move Report there.");
    expect(gridListMessages.cancelled("Report")).toBe("Cancelled moving Report.");
  });

  it("names the destination list for moves between lists", () => {
    expect(gridListMessages.movingToList("Report", "Done", 1, 4)).toBe(
      "Moving Report to Done, position 1 of 4.",
    );
    expect(gridListMessages.movedToList("Report", "Done", 1, 4)).toBe(
      "Moved Report to Done, position 1 of 4.",
    );
    expect(gridListMessages.blockedToList("Report", "Done")).toBe("Cannot move Report to Done.");
  });
});
