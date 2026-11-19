import { validateEdits, validateJsx } from "@comp0/genui/vocabulary";
import { describe, expect, it } from "vitest";
import { editUI } from "./contract.js";
import { initialResponse, invalidResponse, revisionResponse } from "./responses.js";

describe("recorded revision demo", () => {
  it("uses a valid initial tree and a revision accepted by that exact history", () => {
    expect(validateJsx(initialResponse, editUI).errors).toEqual([]);
    const revision = validateEdits(revisionResponse, { ...editUI, history: [initialResponse] });
    expect(revision.errors).toEqual([]);
    expect(revision.operations.map((operation) => operation.target)).toEqual([
      "summary",
      "note",
      "seats",
      "checklist",
    ]);
    expect(revision.operations.at(-1)).toMatchObject({
      kind: "append",
      children: [{ id: "ferry" }],
    });
  });

  it("rejects every operation of the invalid follow-up", () => {
    const invalid = validateEdits(invalidResponse, {
      ...editUI,
      history: [initialResponse, revisionResponse],
    });
    expect(invalid.errors).not.toEqual([]);
    expect(invalid.operations).toEqual([]);
  });
});
