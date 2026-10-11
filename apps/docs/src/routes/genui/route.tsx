import { Link } from "react-router";
import {
  Callout,
  CodeBlock,
  DesktopOutline,
  InlineOutline,
  LessonPager,
  PageIntro,
  SectionLinks,
} from "../../components/teaching/index.js";
import { genuiBySlug, genuiDocs } from "../../content/genui.js";
import referenceData from "../../content/genui-reference.json" with { type: "json" };
import type { GenUIReference, GenUISection } from "../../content/types.js";
import { CatalogGroup } from "./CatalogGroup.js";
import { InlineText } from "./InlineText.js";
import { ReferenceTable } from "./ReferenceTable.js";

const reference: GenUIReference = referenceData;

type GenUIRouteProps = {
  params: { slug?: string | undefined };
};

type GenUIRouteLoaderData = {
  description: string | undefined;
  title: string;
};

export function loader({ params }: GenUIRouteProps): GenUIRouteLoaderData {
  const page = params.slug ? genuiBySlug.get(params.slug) : undefined;
  if (!page) return { description: undefined, title: "Page not found" };
  return { description: page.summary, title: page.title };
}

export function meta({ loaderData }: { loaderData: GenUIRouteLoaderData }) {
  return [
    { title: `${loaderData.title} · GenUI · comp0` },
    { name: "description", content: loaderData.description },
  ];
}

function generatedList(section: GenUISection): string[] {
  if (section.generated === "expression-functions") {
    // "round(x, digits?) rounds to ..." shows its signature as code.
    return reference.expressionFunctions.map((item) =>
      item.summary.replace(/^\w+\([^)]*\)/, (signature) => `\`${signature}\``),
    );
  }
  if (section.generated === "prompt-rules") return reference.promptRules;
  return [];
}

type ReferenceListProps = {
  items: string[];
  className?: string | undefined;
};

function ReferenceList({ items, className }: ReferenceListProps) {
  return (
    <ul
      className={`grid max-w-[66ch] list-disc gap-2 pl-5 text-base/7 text-pretty text-zinc-600 marker:text-zinc-400 dark:text-zinc-300 dark:marker:text-zinc-500 ${className ?? ""}`}
    >
      {items.map((item) => (
        <li key={item}>
          <InlineText text={item} />
        </li>
      ))}
    </ul>
  );
}

export function ServerComponent({ params }: GenUIRouteProps) {
  const { slug } = params;
  const page = slug ? genuiBySlug.get(slug) : undefined;

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
        <p className="text-base/7 font-medium text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
          Page not found
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-white">
          This page is not in the GenUI reference.
        </h1>
        <Link
          className="mt-8 inline-flex rounded-lg bg-teal-700 px-3 py-2.5 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
          to="/genui/overview"
        >
          Go to the GenUI overview
        </Link>
      </div>
    );
  }

  const index = genuiDocs.indexOf(page);
  const previous = genuiDocs[index - 1];
  const next = genuiDocs[index + 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0">
        <PageIntro doc={page} eyebrow="GenUI" />
        <div className="mt-8">
          <InlineOutline sections={page.sections} />
        </div>

        <div className="mt-16 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-16">
          {page.sections.map((section) => (
            <section
              aria-labelledby={`${section.id}-title`}
              className="min-w-0 scroll-mt-24"
              id={section.id}
              key={section.id}
            >
              <h2
                className="text-2xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  className="mt-3 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300"
                  key={paragraph}
                >
                  <InlineText text={paragraph} />
                </p>
              ))}
              {section.code && (
                <CodeBlock
                  className="mt-6"
                  code={section.code}
                  language={section.language}
                  title={section.codeTitle}
                />
              )}
              {section.tables?.map((table) => (
                <ReferenceTable className="mt-6" key={table.caption} table={table} />
              ))}
              {section.list && <ReferenceList className="mt-6" items={section.list} />}
              {section.generated && (
                <ReferenceList className="mt-6" items={generatedList(section)} />
              )}
              {section.catalogGroup && (
                <CatalogGroup
                  className="mt-8"
                  entries={reference.catalog.filter(
                    (entry) => entry.group === section.catalogGroup,
                  )}
                />
              )}
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
          next={next ? { title: next.title, to: `/genui/${next.slug}` } : undefined}
          previous={previous ? { title: previous.title, to: `/genui/${previous.slug}` } : undefined}
        />
      </article>
      <DesktopOutline sections={page.sections} />
    </div>
  );
}
