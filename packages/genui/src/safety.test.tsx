import { describe, expect, it, vi } from "vitest";
import { catalog } from "./catalog/catalog.js";
import { GenUI } from "./render/GenUI.js";
import { validateResponse } from "./validate/validate.js";
import { ValidNode } from "./validate/values.js";
import { kitchenSink } from "../test/fixtures.js";
import { renderResponse, renderStack, setup } from "../test/render.js";

type Json = Record<string, unknown>;

/** The first use of each component in the kitchen sink: valid props for every entry. */
function validNodes(): Map<string, Json> {
  const found = new Map<string, Json>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value !== "object" || value === null) return;
    const node = value as Json;
    if (typeof node.type === "string" && !found.has(node.type)) found.set(node.type, node);
    Object.values(node).forEach(visit);
  };
  visit(kitchenSink);
  return found;
}

const payload = "PWNED";
const handler = vi.fn();

/** Props a hostile model would add to every component, none of them declared in any schema. */
function hostileExtras(): Json {
  return {
    dangerouslySetInnerHTML: { __html: `<img src="x" onerror="${payload}()">` },
    onClick: handler,
    onFocus: handler,
    onChange: handler,
    onSubmit: handler,
    onLoad: handler,
    onError: handler,
    onMouseOver: handler,
    style: { background: `url(javascript:${payload})`, color: "red" },
    srcDoc: `<script>${payload}</script>`,
    srcdoc: `<script>${payload}</script>`,
    className: payload,
    class: payload,
    id: payload,
    role: payload,
    tabIndex: 5,
    action: `javascript:${payload}`,
    formAction: `javascript:${payload}`,
    target: "_blank",
    rel: payload,
    as: "script",
    ref: handler,
    key: payload,
    "aria-label": payload,
    "aria-hidden": "true",
    "data-evil": payload,
    constructor: payload,
  };
}

const topLevel = catalog;

describe("allowlisted props", () => {
  const valid = validNodes();

  it("has valid props for every entry to attack", () => {
    for (const entry of topLevel) expect(valid.has(entry.name), entry.name).toBe(true);
  });

  it.each(topLevel.map((entry) => [entry.name, entry] as const))(
    "%s ignores props its schema does not declare",
    async (_name, entry) => {
      handler.mockClear();
      // The hostile props come first; the schema's own props win where they overlap.
      const node = { ...hostileExtras(), ...valid.get(entry.name) };
      const { container, user } = setup(<GenUI response={node} />);
      const html = container.innerHTML;
      // jsdom cannot navigate; links are only clicked to find attached handlers.
      document.body.addEventListener("click", (event) => event.preventDefault());

      expect(html).not.toContain(payload);
      expect(html).not.toMatch(/\son[a-z]+=/i);
      expect(html).not.toContain("srcdoc");
      expect(html).not.toContain("javascript:");
      expect(container.querySelector("script, iframe, object, embed")).toBeNull();
      // Event handlers a model supplies are never attached.
      for (const element of container.querySelectorAll<HTMLElement>("button, a, input, summary")) {
        await user.click(element);
      }
      expect(handler).not.toHaveBeenCalled();
      expect(({} as { polluted?: string }).polluted).toBeUndefined();
    },
  );

  it("renders declared text as text, never as markup", () => {
    const markup = `<img src="x" onerror="${payload}()"><script>${payload}</script>`;
    const keep = new Set(["href", "src", "name", "value", "type", "tone", "size", "variant"]);
    for (const entry of topLevel) {
      const node = Object.fromEntries(
        Object.entries(valid.get(entry.name) ?? {}).map(([key, value]) => [
          key,
          typeof value === "string" && !keep.has(key) ? markup : value,
        ]),
      );
      const { container, unmount } = setup(<GenUI response={node} />);
      expect(container.querySelector("img[onerror], script"), entry.name).toBeNull();
      const attributes = [...container.querySelectorAll("*")].flatMap((element) =>
        element.getAttributeNames(),
      );
      expect(
        attributes.filter((name) => name.startsWith("on")),
        entry.name,
      ).toEqual([]);
      unmount();
    }
  });

  it("drops undeclared keys when validating", () => {
    const parsed = JSON.parse(
      '{"type":"Text","text":"hi","onClick":"x","__proto__":{"polluted":"y"},"constructor":"z","style":"color:red"}',
    ) as unknown;
    const result = validateResponse(parsed);

    expect(result.root).toBeInstanceOf(ValidNode);
    expect(result.root?.props).toEqual({ text: "hi" });
    expect(Object.getPrototypeOf(result.root?.props)).toBe(Object.prototype);
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
  });

  it("does not let a data position hold a component", () => {
    const result = validateResponse({
      type: "Select",
      label: "L",
      name: "n",
      options: ["a", { value: "b", label: "B", onClick: "x" }, { type: "Button", label: "Evil" }],
    });

    expect(result.root?.props.options).toEqual(["a", { value: "b", label: "B" }]);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("URLs", () => {
  const hostile = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "java\tscript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:x",
    "//evil.example",
    "/\\evil.example",
  ];

  it.each(hostile)("does not link %j", (href) => {
    const { container, getByText } = renderStack([{ type: "Link", label: "Click me", href }]);

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("[href]")).toBeNull();
    expect(getByText("Click me")).toBeTruthy();
  });

  it.each([...hostile, "mailto:a@b.c", "tel:123", "#frag", "https://example.com/a.png"])(
    "does not load %j as an image unless it is http(s) or relative",
    (src) => {
      const { container } = renderStack([{ type: "Image", src, alt: "Alt text" }]);
      const loaded = container.querySelector("img")?.getAttribute("src");
      if (/^https?:\/\//.test(src)) expect(loaded).toBe(src);
      else expect(loaded).toBeUndefined();
    },
  );

  it("links http(s), mailto, tel, relative, and fragment URLs", () => {
    const targets = ["https://example.com/a", "mailto:a@b.c", "tel:+1", "/page", "#section"];
    const { container } = renderStack(targets.map((href) => ({ type: "Link", label: "Go", href })));

    expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(
      targets,
    );
  });

  it("marks absolute links so they cannot reach back into the opener", () => {
    const { container } = renderStack([
      { type: "Link", label: "Docs", href: "https://example.com" },
    ]);

    expect(container.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("loads images lazily without a referrer", () => {
    const { container } = renderStack([{ type: "Image", src: "/a.png", alt: "A chart" }]);
    const image = container.querySelector("img");

    expect(image?.getAttribute("alt")).toBe("A chart");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("never loads a half-written URL while it streams", () => {
    const { container } = renderResponse(
      '{"type": "Stack", "children": [{"type": "Image", "alt": "A", "src": "https://evil.example/track?id=',
      { streaming: true },
    );

    expect(container.querySelector("img")).toBeNull();
  });
});

describe("unknown components and props in a response", () => {
  it("renders nothing for components outside the catalog", () => {
    const { container } = renderStack([
      { type: "Script", text: "alert(1)" },
      { type: "Iframe", src: "https://evil.example" },
      { type: "Text", text: "kept" },
    ]);

    expect(container.querySelector("script, iframe")).toBeNull();
    expect(container.textContent).toContain("kept");
    expect(container.textContent).not.toContain("alert(1)");
  });

  it("ignores extra props beyond the schema", () => {
    const { container } = renderStack([
      { type: "Text", text: "hello", tone: "muted", extra: "onClick=alert(1)", style: { x: 1 } },
    ]);

    expect(container.querySelector("p")?.textContent).toBe("hello");
    expect(container.innerHTML).not.toContain("alert");
  });
});

describe("expressions", () => {
  it("never run code: unknown functions, property access, and prototypes are rejected", () => {
    const hostile = [
      "alert(1)",
      "constructor",
      "constructor.constructor('alert(1)')()",
      "__proto__",
      "this",
      "window.location",
      "(function(){})()",
      "toString()",
    ];
    for (const source of hostile) {
      const { container, unmount } = renderStack([
        { type: "Output", label: "O", value: { $expr: source } },
      ]);
      // Either the expression is rejected, or it reads a name nothing binds and shows nothing.
      const output = container.querySelector("[data-slot=output]");
      expect(output === null || output.textContent === "", source).toBe(true);
      unmount();
    }
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
  });

  it("show text computed from user input as text, not markup", async () => {
    const { container, getByRole, user } = renderStack([
      { type: "TextField", label: "Name", name: "name", value: { $bind: "name" } },
      { type: "Text", text: { $expr: '"Hello " + name' } },
    ]);

    await user.type(getByRole("textbox", { name: "Name" }), "<img src=x onerror=alert(1)>");

    expect(container.querySelector("[data-slot=text]")?.textContent).toBe(
      "Hello <img src=x onerror=alert(1)>",
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("keep a runaway expression cheap", () => {
    const source = `${"1+".repeat(5000)}1`;
    const start = performance.now();
    const { container } = renderStack([{ type: "Output", label: "O", value: { $expr: source } }]);

    expect(container.querySelector("[data-slot=output]")).toBeNull();
    expect(performance.now() - start).toBeLessThan(2000);
  });
});
