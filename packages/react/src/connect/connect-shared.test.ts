import { describe, expect, it } from "vitest";
import { compatiblePorts, portLabel, type ConnectPort } from "./connect-shared.js";

function port(overrides: Partial<ConnectPort>): ConnectPort {
  const element = document.createElement("button");
  return {
    key: "output:color",
    textValue: "Color",
    value: "color",
    label: "Color",
    kind: "color",
    card: "source",
    cardLabel: "Palette",
    direction: "output",
    disabled: false,
    element,
    anchor: element,
    ...overrides,
  };
}

describe("compatiblePorts", () => {
  const output = port({});
  const input = port({ direction: "input", card: "target", key: "input:color" });

  it("connects an enabled output to an enabled input of the same kind on another card", () => {
    expect(compatiblePorts(output, input)).toBe(true);
  });

  it.each([
    ["the same card", { card: "source" }],
    ["a different kind", { kind: "number" }],
    ["a disabled input", { disabled: true }],
  ])("rejects %s", (_name, change) => {
    expect(compatiblePorts(output, { ...input, ...change })).toBe(false);
  });

  it("rejects a disabled output and reversed directions", () => {
    expect(compatiblePorts({ ...output, disabled: true }, input)).toBe(false);
    expect(compatiblePorts(input, output)).toBe(false);
  });
});

describe("portLabel", () => {
  it("names the card, port, and kind", () => {
    expect(portLabel(port({}))).toBe("Palette: Color (color)");
  });
});
