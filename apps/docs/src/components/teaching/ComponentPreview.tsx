import { getExample } from "../../examples/index.js";
import { cn } from "./cn.js";

type ComponentPreviewProps = {
  slug: string;
  className?: string | undefined;
};

// A photo-like thumbnail of a component: the real example rendered inert on a
// fixed-width stage inside a fixed-aspect frame, so every preview has the same
// size and center crop no matter how small the card is.
export function ComponentPreview({ slug, className }: ComponentPreviewProps) {
  const Example = getExample(slug);
  if (!Example) return null;
  return (
    <div
      aria-hidden="true"
      inert
      className={cn(
        "pointer-events-none flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-50 ring-1 ring-zinc-950/5 select-none dark:bg-white/3 dark:ring-white/10",
        className,
      )}
    >
      <div className="grid w-64 shrink-0 scale-90 justify-items-center">
        <Example />
      </div>
    </div>
  );
}
