import { Link } from "react-router";
import type { DocLink } from "../../content/types.js";

type ExampleCardsProps = { links: DocLink[] };
export function ExampleCards({ links }: ExampleCardsProps) {
  return (
    <ul className="mt-5 grid gap-4 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.to} className="min-w-0">
          <Link
            to={link.to}
            aria-label={link.label}
            className="group block h-full overflow-hidden rounded-xl border border-zinc-300 outline-offset-4 hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-teal-700 dark:border-zinc-700 dark:hover:border-teal-300"
          >
            <div className="aspect-[2.5] overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700">
              <img
                src={"/genui-previews/" + link.to.split("/").at(-1) + ".jpg"}
                alt=""
                loading="lazy"
                className="block size-full object-cover object-top"
              />
            </div>
            <div className="p-4">
              <span className="text-base font-semibold text-teal-800 group-hover:underline dark:text-teal-200">
                {link.label}
              </span>
              <p className="mt-1 text-sm/6 text-zinc-700 dark:text-zinc-300">{link.description}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
