import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { ThemedToken } from "shiki/types";
import type { CodeLanguage } from "../../content/types.js";
import { cn } from "./cn.js";
import { getCachedHighlight, getHighlightKey, highlightCode } from "./syntax-highlighter.js";

type CodeBlockProps = {
  code: string;
  language?: CodeLanguage | undefined;
  title?: string | undefined;
  className?: string | undefined;
};

type HighlightState = {
  key: string;
  lines: ThemedToken[][];
};

function getTokenStyle(token: ThemedToken): CSSProperties {
  const fontStyle = token.fontStyle && token.fontStyle > 0 ? token.fontStyle : 0;
  let textDecorationLine: CSSProperties["textDecorationLine"];
  if ((fontStyle & 4) !== 0) textDecorationLine = "underline";
  if ((fontStyle & 8) !== 0) textDecorationLine = "line-through";
  if ((fontStyle & 12) === 12) textDecorationLine = "underline line-through";
  return {
    color: token.color,
    fontStyle: (fontStyle & 1) !== 0 ? "italic" : undefined,
    fontWeight: (fontStyle & 2) !== 0 ? 700 : undefined,
    textDecorationLine,
  };
}

export function CodeBlock({ code, language = "tsx", title, className }: CodeBlockProps) {
  const highlightKey = getHighlightKey(code, language);
  const [highlight, setHighlight] = useState<HighlightState | undefined>(() => {
    const lines = getCachedHighlight(code, language);
    return lines ? { key: highlightKey, lines } : undefined;
  });
  useEffect(() => {
    let active = true;
    const cached = getCachedHighlight(code, language);
    if (cached) {
      setHighlight({ key: highlightKey, lines: cached });
      return;
    }
    highlightCode(code, language).then(
      (lines) => {
        if (active) setHighlight({ key: highlightKey, lines });
      },
      () => {
        if (active) setHighlight(undefined);
      },
    );
    return () => {
      active = false;
    };
  }, [code, highlightKey, language]);
  const lines = highlight?.key === highlightKey ? highlight.lines : undefined;
  let codeContent: ReactNode = code;
  if (lines) {
    codeContent = lines.map((tokens, lineIndex) => (
      <span className="line" key={`${lineIndex}-${tokens[0]?.offset ?? 0}`}>
        {tokens.map((token, tokenIndex) => (
          <span key={`${token.offset}-${tokenIndex}`} style={getTokenStyle(token)}>
            {token.content}
          </span>
        ))}
        {lineIndex < lines.length - 1 ? "\n" : null}
      </span>
    ));
  }

  return (
    <figure
      className={cn(
        "m-0 max-w-full min-w-0 overflow-hidden rounded-xl border border-zinc-950/10 bg-zinc-950 dark:border-white/10",
        className,
      )}
    >
      <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-base font-medium text-zinc-300 sm:text-sm">
        <span>{title ?? "Example"}</span>
        <span className="font-mono tracking-wide text-zinc-500 uppercase">{language}</span>
      </figcaption>
      <pre
        className="max-h-[30rem] max-w-full overflow-auto p-4 font-mono text-base/6 text-zinc-100 [tab-size:2] sm:text-sm"
        tabIndex={0}
      >
        <code
          data-highlighted={Boolean(lines) || undefined}
          data-language={language}
          spellCheck={false}
        >
          {codeContent}
        </code>
      </pre>
    </figure>
  );
}
