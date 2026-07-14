import { Link } from "react-router";
import {
  Anatomy,
  ApiReference,
  Callout,
  CodeBlock,
  KeyboardGuide,
  LessonPager,
  LiveExample,
  PageIntro,
  StateHooks,
  StepList,
} from "../../components/teaching/index.js";
import { componentBySlug, componentGroups, components } from "../../content/index.js";
import { getExampleSource } from "../../examples/sources.js";
import { ComponentOutline } from "./ComponentOutline.js";
import { ComponentSection } from "./ComponentSection.js";

type ComponentRouteProps = {
  params: { slug?: string | undefined };
};

type ComponentRouteLoaderData = {
  description: string | undefined;
  title: string;
};

export function loader({ params }: ComponentRouteProps): ComponentRouteLoaderData {
  const doc = params.slug ? componentBySlug.get(params.slug) : undefined;
  if (!doc) return { description: undefined, title: "Component not found" };
  return { description: doc.summary, title: doc.title };
}

export function meta({ loaderData }: { loaderData: ComponentRouteLoaderData }) {
  return [
    { title: `${loaderData.title} · comp0 component guide` },
    { name: "description", content: loaderData.description },
  ];
}

export function ServerComponent({ params }: ComponentRouteProps) {
  const { slug } = params;
  const doc = slug ? componentBySlug.get(slug) : undefined;

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
        <p className="text-base/7 font-medium text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
          Component not found
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-white">
          That part is not in the public toolbox.
        </h1>
        <p className="mt-4 max-w-[48ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          Open the component index to see every documented pattern in the public API.
        </p>
        <Link
          className="mt-8 inline-flex rounded-lg bg-teal-700 px-3 py-2.5 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
          to="/components"
        >
          Browse components
        </Link>
      </div>
    );
  }

  const group = componentGroups.find((candidate) => candidate.id === doc.group);
  const index = components.indexOf(doc);
  const previous = components[index - 1];
  const next = components[index + 1];
  let keyboardLesson = (
    <Callout title="Nothing to press">
      <p>This helper is not interactive, so it does not add a keyboard contract.</p>
    </Callout>
  );
  if (doc.keyboard.length > 0) keyboardLesson = <KeyboardGuide actions={doc.keyboard} />;
  let stylingLesson = (
    <Callout title="Native styling only">
      <p>This component does not add a custom state hook. Style its native element directly.</p>
    </Callout>
  );
  if (doc.stateHooks.length > 0) stylingLesson = <StateHooks hooks={doc.stateHooks} />;

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0">
        <PageIntro doc={doc} eyebrow={group?.title} />
        <p className="mt-4 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          <strong className="font-medium text-zinc-950 dark:text-white">When to use it:</strong>{" "}
          {doc.whenToUse}
        </p>
        <ComponentOutline className="mt-8 xl:hidden" compact doc={doc} />

        <div className="mt-16 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-16">
          <ComponentSection id="example" title="Example">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
              <LiveExample slug={doc.slug} />
              <CodeBlock
                code={getExampleSource(doc.slug) ?? doc.exampleSource}
                title={`${doc.title}.tsx`}
              />
            </div>
            {doc.moreExamples?.map((variant) => {
              const variantSource = getExampleSource(`${doc.slug}.${variant.id}`);
              if (!variantSource) return null;
              return (
                <section className="mt-10" key={variant.id}>
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                    {variant.title}
                  </h3>
                  <p className="mt-1 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                    {variant.description}
                  </p>
                  <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
                    <LiveExample slug={`${doc.slug}.${variant.id}`} title={variant.title} />
                    <CodeBlock code={variantSource} title={`${doc.slug}.${variant.id}.tsx`} />
                  </div>
                </section>
              );
            })}
          </ComponentSection>

          <ComponentSection
            description="Dashed frames are invisible state providers; shaded shapes own real DOM. Numbered pins match the list below."
            id="anatomy"
            title="Anatomy"
          >
            <Anatomy parts={doc.parts} />
          </ComponentSection>

          <ComponentSection id="build" title="Step by step">
            <StepList steps={doc.steps} />
          </ComponentSection>

          <ComponentSection id="keyboard" title="Keyboard">
            {keyboardLesson}
          </ComponentSection>

          <ComponentSection description={doc.form} id="contract" title="Forms and accessibility">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
              Accessibility checklist
            </h3>
            <ul className="mt-3 grid gap-3" role="list">
              {doc.accessibility.map((item) => (
                <li
                  className="flex items-start gap-3 text-base/7 text-zinc-600 dark:text-zinc-300"
                  key={item}
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400"
                  />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </ComponentSection>

          <ComponentSection id="api" title="API reference">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
              <ApiReference imports={doc.imports} parts={doc.parts} />
              {stylingLesson}
            </div>
          </ComponentSection>
        </div>

        {doc.related.length > 0 && (
          <section className="mt-16 border-t border-zinc-950/10 pt-8 dark:border-white/10">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Keep exploring
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2" role="list">
              {doc.related.map((relatedSlug) => {
                const related = componentBySlug.get(relatedSlug);
                if (!related) return null;
                return (
                  <li key={related.slug}>
                    <Link
                      className="inline-flex min-h-11 items-center rounded-lg border border-zinc-950/10 px-3 py-2 text-base/7 font-medium text-zinc-700 outline-none hover:border-teal-700/30 hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:border-white/10 dark:text-zinc-300 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/10 dark:hover:text-teal-100 dark:focus-visible:outline-teal-400"
                      to={`/components/${related.slug}`}
                    >
                      {related.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <LessonPager
          className="mt-12"
          next={next ? { title: next.title, to: `/components/${next.slug}` } : undefined}
          previous={
            previous ? { title: previous.title, to: `/components/${previous.slug}` } : undefined
          }
        />
      </article>
      <aside className="hidden xl:block">
        <ComponentOutline className="sticky top-24" doc={doc} />
      </aside>
    </div>
  );
}
