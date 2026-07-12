import { Link, useParams } from "react-router";
import { Callout, CodeBlock, LessonPager, PageIntro } from "../../components/teaching/index.js";
import { learnBySlug, learnDocs } from "../../content/index.js";

export function meta({ params }: { params: { slug?: string | undefined } }) {
  const page = params.slug ? learnBySlug.get(params.slug) : undefined;
  if (!page) return [{ title: "Lesson not found · comp0" }];
  return [{ title: `${page.title} · Learn comp0` }, { name: "description", content: page.summary }];
}

function InlineOutline({ page }: { page: (typeof learnDocs)[number] }) {
  return (
    <details className="rounded-xl border border-zinc-950/10 p-4 xl:hidden dark:border-white/10">
      <summary className="min-h-12 cursor-pointer py-2 text-base/7 font-medium text-zinc-950 outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-white dark:focus-visible:outline-teal-400">
        On this page
      </summary>
      <ol
        className="mt-2 grid gap-1 border-t border-zinc-950/10 pt-3 dark:border-white/10"
        role="list"
      >
        {page.sections.map((section) => (
          <li key={section.id}>
            <a
              className="flex min-h-11 min-w-0 items-center rounded-lg p-2 text-base/7 text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
              href={`#${section.id}`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

function DesktopOutline({ page }: { page: (typeof learnDocs)[number] }) {
  return (
    <aside className="hidden xl:block">
      <nav aria-label="On this page" className="sticky top-24">
        <p className="text-sm/6 font-semibold text-zinc-950 dark:text-white">On this page</p>
        <ol
          className="mt-3 grid gap-1 border-l border-zinc-950/10 pl-3 dark:border-white/10"
          role="list"
        >
          {page.sections.map((section) => (
            <li key={section.id}>
              <a
                className="flex min-w-0 rounded-md px-2 py-1.5 text-sm/6 text-zinc-500 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
                href={`#${section.id}`}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

export default function LearnRoute() {
  const { slug } = useParams();
  const page = slug ? learnBySlug.get(slug) : undefined;

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
        <p className="text-base/7 font-medium text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
          Lesson not found
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-white">
          This page is not in the learning path.
        </h1>
        <p className="mt-4 max-w-[48ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          Go back to the first lesson and we will take it one small step at a time.
        </p>
        <Link
          className="mt-8 inline-flex rounded-lg bg-teal-700 px-3 py-2.5 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
          to="/learn/installation"
        >
          Start at installation
        </Link>
      </div>
    );
  }

  const index = learnDocs.indexOf(page);
  const previous = learnDocs[index - 1];
  const next = learnDocs[index + 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0">
        <PageIntro doc={page} eyebrow={`Lesson ${page.order} of ${learnDocs.length}`} />
        <div className="mt-8">
          <InlineOutline page={page} />
        </div>

        <div className="mt-16 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-16">
          {page.sections.map((section) => (
            <section
              aria-labelledby={`${section.id}-title`}
              className="scroll-mt-24"
              id={section.id}
              key={section.id}
            >
              <h2
                className="text-2xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
              <p className="mt-3 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                {section.explanation}
              </p>
              {section.code && (
                <CodeBlock
                  className="mt-6"
                  code={section.code}
                  language={section.language}
                  title="Add this"
                />
              )}
              {section.note && (
                <Callout className="mt-6" title="Keep in mind">
                  <p>{section.note}</p>
                </Callout>
              )}
            </section>
          ))}
        </div>

        <LessonPager
          className="mt-16"
          next={next ? { title: next.title, to: `/learn/${next.slug}` } : undefined}
          previous={previous ? { title: previous.title, to: `/learn/${previous.slug}` } : undefined}
        />
      </article>
      <DesktopOutline page={page} />
    </div>
  );
}
