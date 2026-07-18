"use client";

import { Button, CodeEditor, Description, Label, TextField } from "@comp0/react";
import { useRef, useState } from "react";

const initialCode = `type User = { name: string };
type GreetingOptions = { excited: boolean };

const defaultOptions: GreetingOptions = { excited: true };

export function greet(user: User, options = defaultOptions) {
  const punctuation = options.excited ? "!" : ".";
  const message = \`Hello, \${user.name}\${punctuation}\`;
  console.log(mesage);
  return message;
}

export function greetAll(users: User[]) {
  return users.map((user) => greet(user));
}

const exampleUsers: User[] = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }];
greetAll(exampleUsers);`;

const tokenPattern = /(\/\/.*|`[^`]*`|"[^"]*"|\b[A-Za-z_$][\w$]*\b|\b\d+\b)/g;
const keywords = new Set(["const", "export", "function", "return", "string", "type"]);
const symbolDetails = [
  { name: "User", detail: "type User = { name: string }" },
  { name: "message", detail: "const message: string" },
];

type Diagnostic = {
  severity: "error" | "warning";
  start: number;
  length: number;
  line: number;
  message: string;
};

export function Example() {
  const [source, setSource] = useState(initialCode);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);
  const syntaxRef = useRef<HTMLPreElement>(null);
  const hoverRef = useRef<HTMLPreElement>(null);

  const diagnostics: Diagnostic[] = [];
  const errorStart = source.indexOf("mesage");
  if (errorStart >= 0) {
    diagnostics.push({
      severity: "error",
      start: errorStart,
      length: "mesage".length,
      line: source.slice(0, errorStart).split("\n").length,
      message: "Cannot find name 'mesage'. Did you mean 'message'?",
    });
  }
  const warningStart = source.indexOf("console.log");
  if (warningStart >= 0) {
    diagnostics.push({
      severity: "warning",
      start: warningStart,
      length: "console".length,
      line: source.slice(0, warningStart).split("\n").length,
      message: "Unexpected console statement.",
    });
  }
  let diagnosticSummary = "No problems found";
  if (diagnostics.length > 0) {
    const noun = diagnostics.length === 1 ? "problem" : "problems";
    diagnosticSummary = `${diagnostics.length} ${noun}`;
  }

  let lineStart = 0;
  const lines = source.split("\n").map((line) => {
    let tokenStart = lineStart;
    const tokens = line
      .split(tokenPattern)
      .filter(Boolean)
      .map((text) => {
        const start = source.indexOf(text, tokenStart);
        tokenStart = start + text.length;
        return { text, start };
      });
    lineStart += line.length + 1;
    return tokens;
  });

  return (
    <TextField as="div" className="flex w-full max-w-2xl flex-col gap-2">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        TypeScript source
      </Label>
      <Description className="text-sm text-zinc-500 dark:text-zinc-400">
        Hover User or message for type information. Scroll the source, or choose a diagnostic or
        symbol below to move to it.
      </Description>
      <div className="relative h-64 overflow-visible rounded border border-zinc-950/10 bg-zinc-950 shadow-sm dark:border-white/10">
        <pre
          ref={gutterRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-30 m-0 w-12 overflow-hidden border-r border-white/10 bg-zinc-950 py-4 pr-2 text-right font-mono text-sm/6 text-zinc-500"
        >
          <code>
            {lines.map((_, lineIndex) => (
              <span className="block min-h-6" key={lineIndex}>
                {lineIndex + 1}
              </span>
            ))}
          </code>
        </pre>
        <pre
          ref={syntaxRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden py-4 pr-4 pl-16 font-mono text-sm/6 text-zinc-100 [tab-size:2]"
        >
          <code>
            {lines.map((tokens, lineIndex) => (
              <span className="block min-h-6" key={lineIndex}>
                {tokens.map((token) => {
                  let className = "text-zinc-100";
                  if (keywords.has(token.text)) className = "text-fuchsia-300";
                  if (token.text.startsWith("`") || token.text.startsWith('"')) {
                    className = "text-emerald-300";
                  }
                  if (token.text.startsWith("//")) className = "text-zinc-500 italic";
                  if (/^\d+$/.test(token.text)) className = "text-amber-300";
                  if (token.text === "User") {
                    className =
                      "text-sky-300 underline decoration-sky-400 decoration-dashed underline-offset-4";
                  }
                  if (token.text === "message") {
                    className =
                      "text-zinc-100 underline decoration-sky-400 decoration-dashed underline-offset-4";
                  }
                  if (["greet", "log"].includes(token.text)) className = "text-blue-300";
                  if (token.text === "console") {
                    className =
                      "text-blue-300 underline decoration-amber-400 decoration-wavy underline-offset-4";
                  }
                  if (token.text === "mesage") {
                    className =
                      "text-zinc-100 underline decoration-red-400 decoration-wavy underline-offset-4";
                  }
                  return (
                    <span className={className} key={token.start}>
                      {token.text}
                    </span>
                  );
                })}
              </span>
            ))}
          </code>
        </pre>
        <CodeEditor
          ref={editorRef}
          aria-label="TypeScript source"
          className="relative z-10 h-64 w-full resize-none overflow-auto rounded border-0 bg-transparent py-4 pr-4 pl-16 font-mono text-sm/6 text-transparent caret-white outline-teal-400 [tab-size:2] selection:bg-teal-400/40 selection:text-transparent focus-visible:outline-2 focus-visible:outline-offset-2"
          value={source}
          onChange={(event) => setSource(event.currentTarget.value)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
            if (syntaxRef.current) {
              syntaxRef.current.scrollLeft = event.currentTarget.scrollLeft;
              syntaxRef.current.scrollTop = event.currentTarget.scrollTop;
            }
            if (hoverRef.current) {
              hoverRef.current.scrollLeft = event.currentTarget.scrollLeft;
              hoverRef.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
        />
        <pre
          ref={hoverRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 m-0 overflow-hidden py-4 pr-4 pl-16 font-mono text-sm/6 text-transparent [tab-size:2]"
        >
          <code>
            {lines.map((tokens, lineIndex) => (
              <span className="block min-h-6" key={lineIndex}>
                {tokens.map((token) => {
                  const detail = symbolDetails.find((symbol) => symbol.name === token.text)?.detail;
                  if (!detail) return <span key={token.start}>{token.text}</span>;
                  return (
                    <span className="group/token pointer-events-auto relative" key={token.start}>
                      {token.text}
                      <span className="pointer-events-none absolute top-full left-0 z-30 mt-1 w-max max-w-64 rounded border border-white/10 bg-zinc-800 px-2 py-1 font-sans text-xs/5 text-zinc-100 opacity-0 shadow-lg group-hover/token:opacity-100">
                        {detail}
                      </span>
                    </span>
                  );
                })}
              </span>
            ))}
          </code>
        </pre>
      </div>
      <div className="rounded border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <p
          className="border-b border-zinc-950/10 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-white/10 dark:text-zinc-300"
          aria-live="polite"
        >
          {diagnosticSummary}
        </p>
        {diagnostics.length > 0 && (
          <ul className="divide-y divide-zinc-950/10 dark:divide-white/10">
            {diagnostics.map((diagnostic) => (
              <li key={`${diagnostic.severity}-${diagnostic.start}`}>
                <Button
                  className="flex w-full select-none items-start gap-2 px-3 py-2 text-left text-sm outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 dark:outline-teal-400 dark:hover:bg-zinc-800"
                  onClick={() => {
                    editorRef.current?.focus();
                    editorRef.current?.setSelectionRange(
                      diagnostic.start,
                      diagnostic.start + diagnostic.length,
                    );
                  }}
                >
                  <span
                    className={diagnostic.severity === "error" ? "text-red-600" : "text-amber-600"}
                    aria-hidden="true"
                  >
                    ●
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                      {diagnostic.severity} on line {diagnostic.line}
                    </span>
                    <span className="block text-zinc-600 dark:text-zinc-400">
                      {diagnostic.message}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-zinc-950/10 px-3 py-2 dark:border-white/10">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Symbol information</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {symbolDetails.map((symbol) => (
              <Button
                className="select-none rounded px-2 py-1 text-left text-sm outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800"
                key={symbol.name}
                onClick={() => {
                  const start = source.indexOf(symbol.name);
                  if (start < 0) return;
                  editorRef.current?.focus();
                  editorRef.current?.setSelectionRange(start, start + symbol.name.length);
                }}
              >
                <code className="text-sky-700 dark:text-sky-300">{symbol.name}</code>
                <span className="text-zinc-500 dark:text-zinc-400"> {symbol.detail}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </TextField>
  );
}
