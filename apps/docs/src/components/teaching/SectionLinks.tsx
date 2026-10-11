import { Link } from "react-router";
import type { DocLink } from "../../content/types.js";
import { cn } from "./cn.js";

type SectionLinksProps = {
  links: DocLink[];
  className?: string | undefined;
};

/** Follow-up links after a section. A path with a file extension is a file, so it reloads. */
export function SectionLinks({ links, className }: SectionLinksProps) {
  return (
    <ul className={cn("grid max-w-[66ch] gap-3", className)} role="list">
      {links.map((link) => (
        <li className="text-base/7 text-zinc-600 dark:text-zinc-300" key={link.to}>
          <Link
            className="font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 outline-none hover:decoration-teal-800 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-200 dark:decoration-teal-200/30 dark:hover:decoration-teal-200 dark:focus-visible:outline-teal-400"
            reloadDocument={/\.\w+$/.test(link.to)}
            to={link.to}
          >
            {link.label}
          </Link>
          {link.description && <span>: {link.description}</span>}
        </li>
      ))}
    </ul>
  );
}
