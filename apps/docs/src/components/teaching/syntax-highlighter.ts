import bash from "@shikijs/langs/bash";
import css from "@shikijs/langs/css";
import tsx from "@shikijs/langs/tsx";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemedToken, ThemeRegistration } from "shiki/types";
import type { CodeLanguage } from "../../content/types.js";

const phSyntaxTheme = {
  name: "ph-syntax",
  type: "dark",
  fg: "var(--syntax-foreground)",
  bg: "transparent",
  settings: [
    {
      settings: {
        foreground: "var(--syntax-foreground)",
        background: "transparent",
      },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "var(--syntax-comment)", fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted", "string.template"],
      settings: { foreground: "var(--syntax-string)" },
    },
    {
      scope: ["string.regexp", "string.special", "string.unquoted"],
      settings: { foreground: "var(--syntax-string-special)" },
    },
    {
      scope: ["constant.numeric", "constant.language", "constant.character", "number"],
      settings: { foreground: "var(--syntax-number)", fontStyle: "bold" },
    },
    {
      scope: ["constant.character.escape", "constant.other.placeholder"],
      settings: { foreground: "var(--syntax-escape)", fontStyle: "bold" },
    },
    {
      scope: ["keyword", "keyword.operator.new", "keyword.operator.expression"],
      settings: { foreground: "var(--syntax-keyword)" },
    },
    {
      scope: [
        "keyword.control",
        "keyword.control.conditional",
        "keyword.control.flow",
        "keyword.control.import",
        "keyword.control.return",
      ],
      settings: { foreground: "var(--syntax-control)" },
    },
    {
      scope: ["storage", "storage.type", "storage.modifier"],
      settings: { foreground: "var(--syntax-storage)" },
    },
    {
      scope: ["entity.name.function", "meta.function-call variable.function"],
      settings: { foreground: "var(--syntax-function)" },
    },
    {
      scope: ["support.function", "variable.function", "function.method.call"],
      settings: { foreground: "var(--syntax-function-call)" },
    },
    {
      scope: ["entity.name.type", "entity.other.inherited-class", "support.class"],
      settings: { foreground: "var(--syntax-type)" },
    },
    {
      scope: ["support.type", "support.type.primitive", "storage.type.primitive"],
      settings: { foreground: "var(--syntax-type-builtin)" },
    },
    {
      scope: ["entity.name.tag", "support.class.component"],
      settings: { foreground: "var(--syntax-tag)" },
    },
    {
      scope: ["entity.other.attribute-name", "support.type.property-name"],
      settings: { foreground: "var(--syntax-attribute)" },
    },
    {
      scope: ["variable.other.property", "variable.other.object.property", "meta.property-name"],
      settings: { foreground: "var(--syntax-property)" },
    },
    {
      scope: ["variable", "variable.other", "variable.other.readwrite"],
      settings: { foreground: "var(--syntax-variable)" },
    },
    {
      scope: ["variable.parameter", "meta.function.parameters"],
      settings: { foreground: "var(--syntax-parameter)" },
    },
    {
      scope: ["keyword.operator", "operator"],
      settings: { foreground: "var(--syntax-operator)" },
    },
    {
      scope: ["punctuation", "punctuation.definition", "meta.brace"],
      settings: { foreground: "var(--syntax-punctuation)" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "var(--syntax-invalid)", fontStyle: "underline" },
    },
  ],
} satisfies ThemeRegistration;

const highlighterPromise = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [...bash, ...css, ...tsx],
  themes: [phSyntaxTheme],
});

const pendingHighlights = new Map<string, Promise<ThemedToken[][]>>();
const resolvedHighlights = new Map<string, ThemedToken[][]>();

export function getHighlightKey(code: string, language: CodeLanguage) {
  return `${language}\u0000${code}`;
}

export function getCachedHighlight(code: string, language: CodeLanguage) {
  return resolvedHighlights.get(getHighlightKey(code, language));
}

export function highlightCode(code: string, language: CodeLanguage) {
  const key = getHighlightKey(code, language);
  const resolved = resolvedHighlights.get(key);
  if (resolved) return Promise.resolve(resolved);
  const pending = pendingHighlights.get(key);
  if (pending) return pending;

  const highlight = highlighterPromise
    .then((highlighter) =>
      highlighter.codeToTokens(code, { lang: language, theme: phSyntaxTheme.name }),
    )
    .then(({ tokens }) => {
      resolvedHighlights.set(key, tokens);
      pendingHighlights.delete(key);
      return tokens;
    })
    .catch((error: unknown) => {
      pendingHighlights.delete(key);
      throw error;
    });
  pendingHighlights.set(key, highlight);
  return highlight;
}
