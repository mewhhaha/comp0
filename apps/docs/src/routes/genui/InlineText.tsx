export type InlineTextProps = {
  text: string;
};

/** Text with `backtick` spans rendered as code, the way the reference content is written. */
export function InlineText({ text }: InlineTextProps) {
  return text.split("`").map((part, index) => {
    // Odd parts sit between a pair of backticks.
    if (index % 2 === 0) return part;
    return (
      <code
        className="rounded bg-zinc-950/5 px-1 py-0.5 font-mono text-[0.875em] wrap-anywhere text-zinc-950 dark:bg-white/10 dark:text-white"
        key={index}
      >
        {part}
      </code>
    );
  });
}
