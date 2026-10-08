export function writingDirection(element: Element): "ltr" | "rtl" {
  const ownerWindow = element.ownerDocument.defaultView;
  if (ownerWindow?.getComputedStyle(element).direction === "rtl") return "rtl";
  return "ltr";
}
