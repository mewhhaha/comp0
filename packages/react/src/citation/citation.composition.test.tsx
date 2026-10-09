import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { BusyRegion } from "../busy-region/BusyRegion.js";
import { Citation } from "./Citation.js";
import { Citations } from "./Citations.js";
import { Source } from "./Source.js";
import { Sources } from "./Sources.js";

function Answer({ missing = false }: { missing?: boolean }) {
  return (
    <Citations>
      <p>
        Tea grows at altitude <Citation value="atlas" /> and in lowlands{" "}
        <Citation value={missing ? "ghost" : "farm"} />.
      </p>
      <Sources aria-label="Sources">
        <Source value="farm" title="Lowland farms" href="https://example.com/farm">
          Journal, 2024
        </Source>
        <Source value="atlas" title="Tea atlas" />
      </Sources>
    </Citations>
  );
}

describe("citation composition", () => {
  it("numbers citations by their source's position in the list", () => {
    const { getByRole } = setup(<Answer />);

    const atlas = getByRole("link", { name: "Source 2: Tea atlas" });
    const farm = getByRole("link", { name: "Source 1: Lowland farms" });
    expect(atlas.textContent).toContain("[2]");
    expect(farm.textContent).toContain("[1]");
  });

  it("links each citation to its source entry", () => {
    const { getByRole } = setup(<Answer />);

    const href = getByRole("link", { name: "Source 2: Tea atlas" }).getAttribute("href");
    const target = document.getElementById(href!.slice(1));
    expect(target?.getAttribute("data-value")).toBe("atlas");
    expect(target?.getAttribute("data-number")).toBe("2");
    expect(target?.tagName).toBe("LI");
  });

  it("links a source title to its url and shows details", () => {
    const { getByRole, getByText } = setup(<Answer />);

    expect(getByRole("link", { name: "Lowland farms" }).getAttribute("href")).toBe(
      "https://example.com/farm",
    );
    expect(getByText("Journal, 2024")).not.toBeNull();
    expect(getByRole("list", { name: "Sources" }).tagName).toBe("OL");
  });

  it("degrades a citation to a missing source and warns once", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = setup(<Answer missing />);

    const missing = container.querySelector("[data-missing]");
    expect(missing?.tagName).toBe("SPAN");
    expect(missing?.textContent).toContain("[?]");
    expect(error).toHaveBeenCalledWith(expect.stringContaining('"ghost"'));
    error.mockRestore();
  });

  it("stays silent and reports pending while a busy region assembles the answer", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = setup(
      <BusyRegion busy>
        <Answer missing />
      </BusyRegion>,
    );

    expect(container.querySelector("[data-pending]")).not.toBeNull();
    expect(container.querySelector("[data-missing]")).toBeNull();
    expect(error).not.toHaveBeenCalledWith(expect.stringContaining('"ghost"'));
    error.mockRestore();
  });

  it("renders custom citation content and keeps the numbered name", () => {
    const { getByRole } = setup(
      <Citations>
        <Citation value="a">see note</Citation>
        <Sources>
          <Source value="a" title="Alpha" />
        </Sources>
      </Citations>,
    );

    expect(getByRole("link", { name: "Source 1: Alpha" }).textContent).toContain("see note");
  });
});
