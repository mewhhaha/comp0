import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Comparison } from "./Comparison.js";
import { ComparisonBody } from "./ComparisonBody.js";
import { ComparisonFeature } from "./ComparisonFeature.js";
import { ComparisonHeader } from "./ComparisonHeader.js";
import { ComparisonOption } from "./ComparisonOption.js";
import { ComparisonRow } from "./ComparisonRow.js";
import { ComparisonValue } from "./ComparisonValue.js";

function Plans({
  recommended = "pro",
  unknown = false,
}: {
  recommended?: string;
  unknown?: boolean;
}) {
  return (
    <Comparison aria-label="Plans">
      <ComparisonHeader>
        <tr>
          <th scope="col">Feature</th>
          <ComparisonOption value="free" recommended={recommended === "free"}>
            Free
          </ComparisonOption>
          <ComparisonOption value="pro" recommended={recommended === "pro"}>
            Pro
          </ComparisonOption>
        </tr>
      </ComparisonHeader>
      <ComparisonBody>
        <ComparisonRow>
          <ComparisonFeature>Projects</ComparisonFeature>
          <ComparisonValue option="free">3</ComparisonValue>
          <ComparisonValue option="pro">Unlimited</ComparisonValue>
        </ComparisonRow>
        <ComparisonRow>
          <ComparisonFeature>Support</ComparisonFeature>
          <ComparisonValue option={unknown ? "nope" : "free"} included={false}>
            -
          </ComparisonValue>
          <ComparisonValue option="pro" included>
            +
          </ComparisonValue>
        </ComparisonRow>
        <ComparisonRow>
          <ComparisonFeature>Uptime</ComparisonFeature>
          <ComparisonValue option="free">99%</ComparisonValue>
          <ComparisonValue option="pro">99%</ComparisonValue>
        </ComparisonRow>
      </ComparisonBody>
    </Comparison>
  );
}

describe("comparison composition", () => {
  it("builds a table whose cells are announced with their option and feature", () => {
    const { getByRole, getAllByRole } = setup(<Plans />);

    expect(getByRole("table", { name: "Plans" })).not.toBeNull();
    const columns = getAllByRole("columnheader");
    expect(columns.map((header) => header.getAttribute("scope"))).toEqual(["col", "col", "col"]);
    const rowHeaders = getAllByRole("rowheader");
    expect(rowHeaders.map((header) => header.textContent)).toEqual([
      "Projects",
      "Support",
      "Uptime",
    ]);
  });

  it("conveys the recommended option to assistive technology and as data", () => {
    const { getByRole, container } = setup(<Plans />);

    expect(
      getByRole("columnheader", { name: "Pro, Recommended" }).hasAttribute("data-recommended"),
    ).toBe(true);
    expect(getByRole("columnheader", { name: "Free" }).hasAttribute("data-recommended")).toBe(
      false,
    );
    const recommendedCells = container.querySelectorAll("td[data-recommended]");
    expect([...recommendedCells].map((cell) => cell.getAttribute("data-option"))).toEqual([
      "pro",
      "pro",
      "pro",
    ]);
  });

  it("follows a recommendation change", () => {
    const { container, rerender } = setup(<Plans />);
    rerender(<Plans recommended="free" />);

    const marked = container.querySelectorAll("th[data-recommended]");
    expect([...marked].map((cell) => cell.getAttribute("data-value"))).toEqual(["free"]);
  });

  it("gives boolean values text alternatives and hides the decorative mark", () => {
    const { getByRole } = setup(<Plans />);

    const support = getByRole("row", { name: /Support/ });
    expect(support.textContent).toContain("Not included");
    expect(support.textContent).toContain("Included");
    expect(support.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);
    expect(support.querySelector("td[data-included]")?.getAttribute("data-option")).toBe("pro");
  });

  it("marks rows whose values differ", () => {
    const { getByRole } = setup(<Plans />);

    expect(getByRole("row", { name: /Projects/ }).hasAttribute("data-differs")).toBe(true);
    expect(getByRole("row", { name: /Uptime/ }).hasAttribute("data-differs")).toBe(false);
    expect(getByRole("cell", { name: "Unlimited" }).hasAttribute("data-differs")).toBe(true);
    expect(getAllCells(getByRole("row", { name: /Uptime/ }))).toEqual([false, false]);
  });

  it("warns once about a value whose option does not exist", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    setup(<Plans unknown />);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('option "nope"'));
    error.mockRestore();
  });

  it("warns when the table has no accessible name", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    setup(<Comparison />);

    expect(error).toHaveBeenCalledWith(expect.stringContaining("accessible name"));
    error.mockRestore();
  });

  it("accepts a native caption as the name", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByRole } = setup(
      <Comparison>
        <caption>Editions</caption>
      </Comparison>,
    );

    expect(getByRole("table", { name: "Editions" })).not.toBeNull();
    error.mockRestore();
  });

  it("updates differs when a value changes", async () => {
    function Live() {
      const [pro, setPro] = useState("1");
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setPro("2");
            }}
          >
            change
          </button>
          <Comparison aria-label="Live">
            <ComparisonBody>
              <ComparisonRow>
                <ComparisonFeature>Seats</ComparisonFeature>
                <ComparisonValue option="a">1</ComparisonValue>
                <ComparisonValue option="b">{pro}</ComparisonValue>
              </ComparisonRow>
            </ComparisonBody>
          </Comparison>
        </>
      );
    }
    const { getByRole, user } = setup(<Live />);
    expect(getByRole("row").hasAttribute("data-differs")).toBe(false);
    await user.click(getByRole("button"));
    await vi.waitFor(() => {
      expect(getByRole("row").hasAttribute("data-differs")).toBe(true);
    });
  });
});

function getAllCells(row: HTMLElement) {
  return [...row.querySelectorAll("td")].map((cell) => cell.hasAttribute("data-differs"));
}
