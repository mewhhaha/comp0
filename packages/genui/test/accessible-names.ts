import { expect } from "vitest";

function text(element: Element | null | undefined): string {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function hidden(element: Element): boolean {
  return element.closest("[aria-hidden='true'], [hidden], [inert]") !== null;
}

/** The name an assistive technology would compute for an element, in the cases the catalog uses. */
export function accessibleName(element: Element): string {
  const labelledby = element.getAttribute("aria-labelledby");
  if (labelledby !== null) {
    const owner = element.ownerDocument;
    const name = labelledby
      .split(/\s+/)
      .map((id) => text(owner.getElementById(id)))
      .join(" ")
      .trim();
    if (name !== "") return name;
  }
  const label = element.getAttribute("aria-label")?.trim();
  if (label) return label;
  const labels = (element as HTMLInputElement).labels;
  if (labels) {
    const name = [...labels]
      .map((entry) => text(entry))
      .join(" ")
      .trim();
    if (name !== "") return name;
  }
  const alt = element.getAttribute("alt")?.trim();
  if (alt) return alt;
  const own = text(element);
  if (own !== "") return own;
  return element.getAttribute("title")?.trim() ?? "";
}

const named =
  "button, a[href], input:not([type=hidden]), select, textarea, meter, progress, output, img, " +
  "table, form, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], " +
  "[role=slider], [role=spinbutton], [role=combobox], [role=textbox], [role=tab], " +
  "[role=progressbar], [role=meter], [role=img], [role=group], [role=radiogroup], [role=tablist]";

/**
 * Asserts that every control, image, table, and form in `container` has an accessible name and
 * that no id appears twice. Call it when the model supplied the names the schema requires.
 */
export function expectAccessibleNames(container: Element) {
  const missing: string[] = [];
  for (const element of container.querySelectorAll(named)) {
    if (hidden(element)) continue;
    // A radiogroup or group is named by its legend; a plain div[role=group] around a status is not.
    if (
      element.matches("[role=group]") &&
      !element.hasAttribute("aria-label") &&
      !element.hasAttribute("aria-labelledby")
    ) {
      if (element.closest("fieldset") === null && element.tagName !== "DIV") continue;
    }
    if (element.matches("img") && !element.hasAttribute("alt")) {
      missing.push("img without alt");
      continue;
    }
    if (element.matches("table")) {
      if (element.querySelector(":scope > caption") === null && accessibleName(element) === "") {
        missing.push("table without caption");
      }
      continue;
    }
    if (element.matches("output")) {
      // The live region NumberField keeps for announcements is not a result.
      if (element.matches("[aria-live]")) continue;
    }
    if (element.matches("input[type=checkbox], input[type=radio]") && element.closest("label"))
      continue;
    if (accessibleName(element) === "") {
      missing.push(`${element.tagName.toLowerCase()} ${element.outerHTML.slice(0, 100)}`);
    }
  }
  expect(missing, "elements without an accessible name").toEqual([]);

  const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
  expect(
    ids.filter((id, index) => ids.indexOf(id) !== index),
    "duplicate ids",
  ).toEqual([]);
}
