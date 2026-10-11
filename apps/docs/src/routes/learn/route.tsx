import { Link } from "react-router";
import {
  Callout,
  CodeBlock,
  DesktopOutline,
  InlineOutline,
  IntelligentUiDemo,
  LessonPager,
  PageIntro,
  SectionLinks,
} from "../../components/teaching/index.js";
import { learnBySlug, learnDocs } from "../../content/index.js";

type LearnRouteProps = {
  params: { slug?: string | undefined };
};

type LearnRouteLoaderData = {
  description: string | undefined;
  title: string;
};

export function loader({ params }: LearnRouteProps): LearnRouteLoaderData {
  const page = params.slug ? learnBySlug.get(params.slug) : undefined;
  if (!page) return { description: undefined, title: "Lesson not found" };
  return { description: page.summary, title: page.title };
}

export function meta({ loaderData }: { loaderData: LearnRouteLoaderData }) {
  return [
    { title: `${loaderData.title} · Learn comp0` },
    { name: "description", content: loaderData.description },
  ];
}

export function ServerComponent({ params }: LearnRouteProps) {
  const { slug } = params;
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
          <InlineOutline sections={page.sections} />
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
              {section.demo === "intelligent-ui" && <IntelligentUiDemo className="mt-6" />}
              {section.note && (
                <Callout className="mt-6" title="Keep in mind">
                  <p>{section.note}</p>
                </Callout>
              )}
              {section.links && <SectionLinks className="mt-6" links={section.links} />}
            </section>
          ))}
        </div>

        <LessonPager
          className="mt-16"
          next={next ? { title: next.title, to: `/learn/${next.slug}` } : undefined}
          previous={previous ? { title: previous.title, to: `/learn/${previous.slug}` } : undefined}
        />
      </article>
      <DesktopOutline sections={page.sections} />
    </div>
  );
}
