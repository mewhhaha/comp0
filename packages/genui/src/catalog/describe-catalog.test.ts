import { describe, expect, it } from "vitest";
import { z } from "zod";
import { catalog } from "./catalog.js";
import { describeCatalog } from "./describe-catalog.js";
import { bindable, nodes } from "./schema.js";
import { defineEntry } from "./types.js";

describe("describeCatalog", () => {
  it("describes every built-in component and prop in catalog order", () => {
    const described = describeCatalog();
    expect(described.map((entry) => entry.name)).toEqual(catalog.map((entry) => entry.name));
    for (const [index, entry] of catalog.entries()) {
      expect(described[index]!.group).toBe(entry.group);
      expect(described[index]!.description).toBe(entry.description);
      expect(described[index]!.props.map((prop) => prop.name)).toEqual(
        Object.keys(entry.props.shape),
      );
    }
  });

  it("writes readable types, required flags, and descriptions", () => {
    const Panel = defineEntry({
      name: "Panel",
      group: "Layout",
      description: "A panel.",
      props: z.object({
        title: z.string().describe("Visible title."),
        size: z.enum(["sm", "lg"]).optional(),
        value: bindable(z.number()).optional(),
        children: nodes("Content."),
      }),
      component: () => null,
    });
    expect(describeCatalog([Panel])).toEqual([
      {
        name: "Panel",
        group: "Layout",
        description: "A panel.",
        props: [
          { name: "title", type: "string", required: true, description: "Visible title." },
          { name: "size", type: '"sm" | "lg"', required: false, description: "" },
          { name: "value", type: "number | Binding", required: false, description: "" },
          { name: "children", type: "Component[]", required: true, description: "Content." },
        ],
      },
    ]);
  });

  it("is plain JSON", () => {
    const described = describeCatalog();
    expect(JSON.parse(JSON.stringify(described))).toEqual(described);
  });
});
