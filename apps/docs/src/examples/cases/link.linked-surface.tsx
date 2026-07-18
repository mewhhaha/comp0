import { Link, ToggleButton } from "@comp0/react";

const homes = [
  {
    id: "cedar-house",
    title: "Cedar House",
    location: "Sellwood, Portland",
    price: "$785,000",
    summary: "3 beds · 2 baths · 1,840 sq ft",
    viewing: "Open Sunday",
    mediaClassName: "from-amber-100 to-orange-200 dark:from-amber-950 dark:to-orange-900",
  },
  {
    id: "garden-studio",
    title: "Garden Studio",
    location: "Ballard, Seattle",
    price: "$619,000",
    summary: "2 beds · 1 bath · 1,120 sq ft",
    viewing: "New listing",
    mediaClassName: "from-teal-100 to-cyan-200 dark:from-teal-950 dark:to-cyan-900",
  },
];

export function Example() {
  return (
    <ul className="grid w-full max-w-2xl list-none gap-3 p-0 sm:grid-cols-2">
      {homes.map((home) => (
        <li key={home.id}>
          <article
            id={home.id}
            className="relative overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
          >
            <div className={`relative h-32 overflow-hidden bg-linear-to-br ${home.mediaClassName}`}>
              <svg
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 mx-auto h-28 w-44 text-white/70 dark:text-white/10"
                viewBox="0 0 176 112"
              >
                <path d="M22 100V52l66-38 66 38v48H22Z" fill="currentColor" />
                <path
                  d="M68 100V67h40v33M39 62l49-29 49 29"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                />
              </svg>
              <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-950/80 dark:text-zinc-200">
                {home.viewing}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {home.price}
                  </p>
                  <h3 className="mt-1 text-base sm:text-sm">
                    <Link
                      href={`#${home.id}`}
                      className="font-medium text-teal-700 underline decoration-transparent underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:decoration-current hover:after:bg-teal-500/5 focus-visible:after:-outline-offset-2 focus-visible:after:outline-2 focus-visible:after:outline-teal-600 dark:text-teal-300 dark:focus-visible:after:outline-teal-400"
                    >
                      {home.title}
                    </Link>
                  </h3>
                </div>
                <ToggleButton
                  aria-label={`Save ${home.title}`}
                  className="relative z-10 shrink-0 select-none rounded-full border border-zinc-950/10 bg-white p-2 text-zinc-500 outline-teal-600 hover:bg-zinc-50 hover:text-rose-600 focus-visible:outline-2 data-selected:bg-rose-50 data-selected:text-rose-600 [&[data-selected]_svg]:fill-current dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:data-selected:bg-rose-950"
                >
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                  </svg>
                </ToggleButton>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{home.location}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{home.summary}</p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
