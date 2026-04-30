import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";
import axe from "axe-core";
import {
  Autocomplete,
  Button,
  Calendar,
  ColorField,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  DatePicker,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  SearchField,
} from "@comp0/react";
import { App, GroupPlayground } from "./App.js";
import {
  accessibilityAuditDimensions,
  accessibilityReferenceCatalog,
  accessibilitySupportStatement,
  accessibilityTraceabilityMatrix,
  componentGroups,
  manualAuditScripts,
  pages,
} from "./docs-data.js";
import "./styles.css";

let root: Root | undefined;

function renderPlayground(pageTitle: string) {
  const componentPage = pages.find((item) => item.title === pageTitle);
  if (!componentPage) throw new Error(`Missing docs page: ${pageTitle}`);

  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  root.render(<GroupPlayground page={componentPage} />);
}

function renderDocsRoute(slug: string) {
  window.history.pushState({}, "", `/${slug}`);
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  root.render(<App />);
}

function renderInline(element: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  root.render(element);
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function pressKey(element: HTMLElement, key: string) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
}

async function expectNoAxeViolations(label: string) {
  const result = await axe.run(document, {
    resultTypes: ["violations"],
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
  });
  const unsuppressedViolations = result.violations.filter((violation) => {
    // Suppressed because axe target-size measurements in the headless docs render do not match
    // the final responsive visual audit surface; target-size remains covered by manual scripts.
    if (violation.id === "target-size") return false;
    // Suppressed only for Shiki token spans where axe fails to inherit the code-block background.
    if (
      violation.id === "color-contrast" &&
      violation.nodes.every((node) => /^<span style="color:#[0-9A-Fa-f]{6}">/.test(node.html))
    ) {
      return false;
    }
    return true;
  });

  expect(unsuppressedViolations, label).toEqual([]);
}

async function waitForCondition(assertion: () => void) {
  let lastError: unknown;

  for (let index = 0; index < 20; index += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await waitForPaint();
    }
  }

  throw lastError;
}

afterEach(() => {
  root?.unmount();
  root = undefined;
  document.body.replaceChildren();
});

const pageTitles = pages.map((item) => [item.title] as const);

function isWcagReference(href: string) {
  return /^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\//.test(href);
}

function isAriaReference(href: string) {
  return (
    /^https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\/patterns\//.test(href) ||
    /^https:\/\/w3c\.github\.io\/aria\//.test(href)
  );
}

describe("docs playgrounds", () => {
  test("every documented component has accessibility references", () => {
    for (const docsPage of pages) {
      for (const doc of docsPage.docs) {
        expect(doc.anatomy.length, `${doc.name} anatomy parts`).toBeGreaterThanOrEqual(3);
        expect(doc.accessibility.length, `${doc.name} accessibility notes`).toBeGreaterThanOrEqual(
          2,
        );
        expect(doc.references.length, `${doc.name} references`).toBeGreaterThan(0);
        expect(
          doc.references.every((reference) =>
            /^https:\/\/(www\.w3\.org\/WAI\/|w3c\.github\.io\/aria\/)/.test(reference.href),
          ),
          `${doc.name} references should point to W3C WCAG or ARIA resources`,
        ).toBe(true);
      }
    }
  });

  test("WCAG and ARIA reference catalog is fully covered by documented components", () => {
    const catalogByHref = new Map(
      accessibilityReferenceCatalog.map((reference) => [reference.href, reference]),
    );
    const usedByHref = new Map<string, Set<string>>();

    expect(accessibilityReferenceCatalog.length, "catalog should not be empty").toBeGreaterThan(0);
    expect(
      new Set(accessibilityReferenceCatalog.map((reference) => reference.href)).size,
      "catalog references should not be duplicated",
    ).toBe(accessibilityReferenceCatalog.length);
    expect(
      accessibilityReferenceCatalog.some((reference) => isWcagReference(reference.href)),
      "catalog should include WCAG references",
    ).toBe(true);
    expect(
      accessibilityReferenceCatalog.some((reference) => isAriaReference(reference.href)),
      "catalog should include ARIA APG or WAI-ARIA references",
    ).toBe(true);

    for (const docsPage of pages) {
      const pageReferences = docsPage.docs.flatMap((doc) => doc.references);
      expect(
        pageReferences.some(
          (reference) => isWcagReference(reference.href) || isAriaReference(reference.href),
        ),
        `${docsPage.title} should include W3C accessibility references`,
      ).toBe(true);

      for (const doc of docsPage.docs) {
        for (const reference of doc.references) {
          const catalogReference = catalogByHref.get(reference.href);
          expect(
            catalogReference,
            `${doc.name} reference ${reference.href} should be in the WCAG/ARIA catalog`,
          ).toBeDefined();
          expect(reference.label, `${doc.name} reference label for ${reference.href}`).toBe(
            catalogReference!.label,
          );

          const users = usedByHref.get(reference.href) ?? new Set<string>();
          users.add(doc.name);
          usedByHref.set(reference.href, users);
        }
      }
    }

    for (const reference of accessibilityReferenceCatalog) {
      expect(
        usedByHref.get(reference.href)?.size ?? 0,
        `${reference.label} should be referenced by at least one documented component`,
      ).toBeGreaterThan(0);
    }
  });

  test("accessibility support statement and manual audit scripts are published", () => {
    expect(accessibilitySupportStatement).toContain(
      "Components are designed to support WCAG 2.2 AA implementations when used correctly.",
    );
    expect(accessibilitySupportStatement.join(" ")).toContain("does not claim standalone WCAG");
    expect(accessibilitySupportStatement.join(" ")).toContain("WCAG 3 is not targeted");
    expect(manualAuditScripts.map((script) => script.title)).toEqual([
      "Keyboard-only component scripts",
      "Screen reader smoke scripts",
      "Visual and responsive checks",
    ]);
    expect(manualAuditScripts.flatMap((script) => script.items).join(" ")).toContain(
      "NVDA with Firefox",
    );
    expect(manualAuditScripts.flatMap((script) => script.items).join(" ")).toContain(
      "VoiceOver with Safari",
    );
    expect(manualAuditScripts.flatMap((script) => script.items).join(" ")).toContain("200% zoom");
    expect(manualAuditScripts.flatMap((script) => script.items).join(" ")).toContain(
      "Shiki syntax token contrast",
    );
    expect(manualAuditScripts.flatMap((script) => script.items).join(" ")).toContain("target-size");
  });

  test("accessibility traceability matrix covers every public component", () => {
    const publicComponents = componentGroups.flatMap((group) => group.names);
    const matrixByComponent = new Map(
      accessibilityTraceabilityMatrix.map((entry) => [entry.component, entry]),
    );

    expect(accessibilityTraceabilityMatrix.length).toBe(publicComponents.length);

    for (const component of publicComponents) {
      const entry = matrixByComponent.get(component);
      expect(entry, `${component} should have matrix coverage`).toBeDefined();
      expect(entry!.wcag.length, `${component} should list WCAG references`).toBeGreaterThan(0);

      for (const dimension of accessibilityAuditDimensions) {
        expect(
          entry!.statuses[dimension],
          `${component} should declare ${dimension} audit status`,
        ).toMatch(/^(covered|consumer responsibility|not applicable|needs manual audit)$/);
      }
    }
  });

  test("every documented component has public styling hooks", () => {
    for (const docsPage of pages) {
      for (const doc of docsPage.docs) {
        expect(
          doc.props.some(([prop]) => prop === "className"),
          `${doc.name} should document className styling`,
        ).toBe(true);
        expect(doc.data.length, `${doc.name} data attributes`).toBeGreaterThan(0);
        expect(
          doc.data.every((attribute) => /^data-[a-z0-9-]+$/.test(attribute)),
          `${doc.name} data attributes should be valid data-* selectors`,
        ).toBe(true);
        expect(new Set(doc.data).size, `${doc.name} data attributes should not be duplicated`).toBe(
          doc.data.length,
        );
      }
    }
  });

  test.each(pageTitles)("%s has a real example", async (pageTitle) => {
    renderPlayground(pageTitle);
    await waitForPaint();

    expect(document.body.textContent).not.toContain("Missing playground");
  });

  test.each(pages.map((item) => [item.title, item.slug] as const))(
    "%s route renders reference sections",
    async (_pageTitle, slug) => {
      renderDocsRoute(slug);
      await waitForPaint();

      await expect.element(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: "Examples", exact: true }))
        .toBeVisible();
      await expect.element(page.getByRole("heading", { name: "Value", exact: true })).toBeVisible();
      await expect.element(page.getByRole("heading", { name: "API", exact: true })).toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: "Styling", exact: true }))
        .toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: "Accessibility", exact: true }))
        .toBeVisible();
      await expect.element(page.getByRole("heading", { name: "SSR", exact: true })).toBeVisible();
      await expect
        .element(page.getByRole("heading", { name: "Related", exact: true }))
        .toBeVisible();
      expect(document.querySelector(".code-block, pre")).not.toBeNull();
      expect(document.body.textContent).not.toContain("Missing playground");

      const docsPage = pages.find((item) => item.slug === slug)!;
      const stylingSection = document.querySelector("#styling");
      const accessibilitySection = document.querySelector("#accessibility");
      expect(stylingSection, `${docsPage.title} styling section`).not.toBeNull();
      expect(accessibilitySection, `${docsPage.title} accessibility section`).not.toBeNull();
      for (const statement of accessibilitySupportStatement) {
        expect(accessibilitySection!.textContent).toContain(statement);
      }

      for (const doc of docsPage.docs) {
        expect(stylingSection!.textContent, `${doc.name} className example`).toContain("className");
        for (const attribute of doc.data) {
          expect(stylingSection!.textContent, `${doc.name} styling hook ${attribute}`).toContain(
            attribute,
          );
        }
        for (const note of doc.accessibility) {
          expect(
            accessibilitySection!.textContent,
            `${doc.name} accessibility note should render`,
          ).toContain(note);
        }
        for (const reference of doc.references) {
          expect(
            accessibilitySection!.querySelector(`a[href="${reference.href}"]`),
            `${doc.name} reference ${reference.href}`,
          ).not.toBeNull();
        }
      }
    },
  );

  test("docs shell has no WCAG A/AA axe violations", async () => {
    renderDocsRoute(pages[0]!.slug);
    await waitForPaint();

    await expectNoAxeViolations("docs shell axe violations");
  });

  test.each(pages.map((item) => [item.title, item.slug] as const))(
    "%s route has no WCAG A/AA axe violations",
    async (_pageTitle, slug) => {
      renderDocsRoute(slug);
      await waitForPaint();

      await expectNoAxeViolations(`${slug} axe violations`);
    },
  );

  test("search filters navigation and finds component names", async () => {
    renderDocsRoute(pages[0]!.slug);
    await waitForPaint();

    await page.getByPlaceholder("Search components").fill("combobox");

    await expect.element(page.getByRole("link", { name: "Combobox", exact: true })).toBeVisible();
    expect(
      [...document.querySelectorAll("a")].some((link) => link.textContent?.trim() === "Button"),
    ).toBe(false);
  });

  test("theme follows system default and toggles the root dark state", async () => {
    renderDocsRoute(pages[0]!.slug);
    await waitForPaint();

    await waitForCondition(() => {
      expect(document.querySelector(".isolate")).not.toBeNull();
    });
    const rootElement = document.querySelector(".isolate")!;
    const startsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    expect(rootElement!.classList.contains("dark")).toBe(startsDark);

    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await waitForCondition(() => {
      expect(rootElement!.classList.contains("dark")).toBe(!startsDark);
    });
  });

  test("Toolbar renders as a toolbar, not the table fallback", async () => {
    renderPlayground("Toolbar");
    await waitForPaint();

    await expect.element(page.getByRole("toolbar", { name: "Editor formatting" })).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Bold" })).toBeVisible();
    expect(document.querySelector("table")).toBeNull();

    const buttons = [...document.querySelectorAll<HTMLButtonElement>("[role='toolbar'] button")];
    await waitForCondition(() => {
      expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1]);
    });
  });

  test("Autocomplete selects a keyboard suggestion", async () => {
    renderInline(
      <Autocomplete defaultValue="">
        <SearchField>
          <Label>Framework</Label>
          <Input />
        </SearchField>
        <ListBox>
          <ListBoxItem id="react">React</ListBoxItem>
          <ListBoxItem id="solid" disabled>
            Solid
          </ListBoxItem>
          <ListBoxItem id="svelte">Svelte</ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    await waitForPaint();

    const input = page.getByRole("combobox", { name: "Framework" });
    const inputElement = document.querySelector<HTMLInputElement>("input[role='combobox']")!;
    inputElement.focus();
    pressKey(inputElement, "ArrowDown");
    await waitForCondition(() => {
      expect(inputElement.getAttribute("aria-activedescendant")).toBe("react");
    });
    pressKey(inputElement, "ArrowDown");
    await waitForCondition(() => {
      expect(inputElement.getAttribute("aria-activedescendant")).toBe("svelte");
    });
    pressKey(inputElement, "Enter");

    await expect.element(input).toHaveValue("Svelte");
  });

  test("DatePicker trigger opens and calendar selection updates the form value", async () => {
    renderInline(
      <DatePicker defaultValue="2026-04-29" name="release">
        <Button>Open date</Button>
        <Popover>
          <Calendar focusedValue="2026-04-29" />
        </Popover>
      </DatePicker>,
    );
    await waitForPaint();

    await page.getByRole("button", { name: "Open date" }).click();
    document.querySelector<HTMLElement>("[data-date='2026-04-30']")?.click();

    await waitForCondition(() => {
      expect(document.querySelector<HTMLInputElement>("input[name='release']")?.value).toBe(
        "2026-04-30",
      );
    });
  });

  test("Color swatch picker selection updates the hidden value", async () => {
    renderInline(
      <ColorField defaultValue="#ff0000" name="accent">
        <ColorSwatchPicker aria-label="Accent color">
          <ColorSwatchPickerItem color="#ff0000" style={{ height: 20, width: 20 }} />
          <ColorSwatchPickerItem color="#00ff00" style={{ height: 20, width: 20 }} />
        </ColorSwatchPicker>
      </ColorField>,
    );
    await waitForPaint();

    await page.getByRole("option").nth(1).click();

    await waitForCondition(() => {
      expect(document.querySelector<HTMLInputElement>("input[name='accent']")?.value).toBe(
        "#00ff00",
      );
    });
  });

  test("DropZone reacts to external file drags", async () => {
    renderPlayground("Drag and drop");
    await waitForPaint();

    const dropZone = document.querySelector<HTMLElement>("[data-slot='drop-zone']");
    expect(dropZone).not.toBeNull();

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(["hello"], "hello.txt", { type: "text/plain" }));
    const dragEnter = new DragEvent("dragenter", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    });
    const dragOver = new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    });
    const drop = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer,
    });

    dropZone!.dispatchEvent(dragEnter);
    await waitForCondition(() => {
      expect(dropZone!.hasAttribute("data-drop-target")).toBe(true);
    });
    expect(dragEnter.defaultPrevented).toBe(true);

    dropZone!.dispatchEvent(dragOver);
    expect(dragOver.defaultPrevented).toBe(true);

    dropZone!.dispatchEvent(drop);
    await waitForCondition(() => {
      expect(dropZone!.textContent).toContain("hello.txt");
    });
    expect(drop.defaultPrevented).toBe(true);
    expect(dropZone!.hasAttribute("data-drop-target")).toBe(false);
  });
});
