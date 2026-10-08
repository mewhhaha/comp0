import { type AnchorHTMLAttributes } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { BreadcrumbLink } from "./BreadcrumbLink.js";
import { Breadcrumbs } from "./Breadcrumbs.js";

describe("breadcrumbs composition", () => {
  it("renders a labelled navigation landmark that a consumer can rename", () => {
    const { container } = render(
      <>
        <Breadcrumbs>
          <ol>
            <li>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </li>
          </ol>
        </Breadcrumbs>
        <Breadcrumbs aria-label="Path to file" />
      </>,
    );
    const [first, second] = [...container.querySelectorAll("nav")];

    expect(first!.getAttribute("aria-label")).toBe("Breadcrumbs");
    expect(second!.getAttribute("aria-label")).toBe("Path to file");
  });

  it("marks only the current link with aria-current and data-current", () => {
    const { container } = render(
      <Breadcrumbs>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbLink href="/docs" current>
          Docs
        </BreadcrumbLink>
      </Breadcrumbs>,
    );
    const [home, docs] = [...container.querySelectorAll("a")];

    expect(home!.hasAttribute("aria-current")).toBe(false);
    expect(home!.hasAttribute("data-current")).toBe(false);
    expect(docs!.getAttribute("aria-current")).toBe("page");
    expect(docs!.hasAttribute("data-current")).toBe(true);
  });

  it("composes router-style links through as", () => {
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
    const { container } = render(
      <Breadcrumbs>
        <BreadcrumbLink as={RouterLink} to="/docs" current>
          Docs
        </BreadcrumbLink>
      </Breadcrumbs>,
    );
    const link = container.querySelector("a")!;

    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.getAttribute("aria-current")).toBe("page");
  });
});
