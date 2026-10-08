import { useState, type AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Pagination, type PaginationRangeEntry } from "./Pagination.js";
import { PaginationEllipsis } from "./PaginationEllipsis.js";
import { PaginationFirst } from "./PaginationFirst.js";
import { PaginationItem } from "./PaginationItem.js";
import { PaginationLast } from "./PaginationLast.js";
import { PaginationList } from "./PaginationList.js";
import { PaginationNext } from "./PaginationNext.js";
import { PaginationPage } from "./PaginationPage.js";
import { PaginationPrevious } from "./PaginationPrevious.js";

function Pages({ pages }: { pages: PaginationRangeEntry[] }) {
  return pages.map((entry) => {
    let control = <PaginationEllipsis />;
    if (typeof entry === "number") control = <PaginationPage value={entry}>{entry}</PaginationPage>;
    return <PaginationItem key={entry}>{control}</PaginationItem>;
  });
}

describe("pagination composition", () => {
  it("builds a labelled native navigation list with page and ellipsis entries", () => {
    const { container } = render(
      <Pagination defaultValue={5} totalPages={10}>
        {({ pages }) => <PaginationList>{<Pages pages={pages} />}</PaginationList>}
      </Pagination>,
    );

    const navigation = container.querySelector("nav")!;
    expect(navigation.getAttribute("aria-label")).toBe("Pagination");
    expect(navigation.dataset["page"]).toBe("5");
    expect(container.querySelectorAll("ul > li")).toHaveLength(7);
    expect(container.querySelector("[aria-current='page']")?.textContent).toBe("5");
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);
  });

  it("moves with page and edge controls and disables unavailable directions", async () => {
    function Example() {
      const [page, setPage] = useState(2);
      return (
        <Pagination value={page} totalPages={4} onChange={setPage}>
          <PaginationFirst>First</PaginationFirst>
          <PaginationPrevious>Previous</PaginationPrevious>
          <PaginationPage value={3}>3</PaginationPage>
          <PaginationNext>Next</PaginationNext>
          <PaginationLast>Last</PaginationLast>
        </Pagination>
      );
    }

    const { container, user } = setup(<Example />);
    const button = (text: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].find(
        (element) => element.textContent === text,
      )!;
    await user.click(button("3"));
    expect(container.querySelector("nav")?.dataset["page"]).toBe("3");
    await user.click(button("Next"));
    expect(container.querySelector("nav")?.dataset["page"]).toBe("4");
    expect(button("Next").hasAttribute("disabled")).toBe(true);
    expect(button("Last").hasAttribute("disabled")).toBe(true);
    await user.click(button("First"));
    expect(container.querySelector("nav")?.dataset["page"]).toBe("1");
    expect(button("Previous").hasAttribute("disabled")).toBe(true);
  });

  it("composes page controls with router-style links", async () => {
    const onChange = vi.fn();
    function RouterLink({
      to,
      children,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
      return (
        <a {...props} href={to}>
          {children}
        </a>
      );
    }

    const { container, user } = setup(
      <Pagination totalPages={5} onChange={onChange}>
        <PaginationPage as={RouterLink} value={2} to="/results?page=2">
          2
        </PaginationPage>
      </Pagination>,
    );
    const link = container.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("/results?page=2");
    expect(link.getAttribute("role")).toBe("link");
    await user.click(link);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("falls back to safe range values and warns once for each invalid count", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <Pagination totalPages={0} siblingCount={-2} boundaryCount={1.5}>
        {({ pages, totalPages }) => `${totalPages}:${pages.join(",")}`}
      </Pagination>,
    );
    expect(container.querySelector("nav")?.textContent).toBe("1:1");
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "Pagination totalPages must be a positive integer; received 0. Using 1.",
      "Pagination siblingCount must be a non-negative integer; received -2. Using 1.",
      "Pagination boundaryCount must be a non-negative integer; received 1.5. Using 1.",
    ]);
    error.mockRestore();
  });
});
