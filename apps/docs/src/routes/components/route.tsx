import { Link, useParams } from "react-router";
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
import { componentBySlug, components } from "../../content/index.js";
import { getExample } from "../../examples/index.js";
import { ComponentOutline } from "./ComponentOutline.js";
import { ComponentSection } from "./ComponentSection.js";

export function meta({ params }: { params: { slug?: string | undefined } }) {
  const doc = params.slug ? componentBySlug.get(params.slug) : undefined;
  if (!doc) return [{ title: "Component not found · comp0" }];
  return [
    { title: `${doc.title} · comp0 component guide` },
    { name: "description", content: doc.summary },
  ];
}

export default function ComponentRoute() {
  const { slug } = useParams();
  const doc = slug ? componentBySlug.get(slug) : undefined;

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
        <p className="font-mono text-sm/6 text-teal-700 dark:text-teal-300">Component not found</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white">
          That part is not in the public toolbox.
        </h1>
        <p className="mt-5 text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          Open the component index to see every pattern that has graduated into this alpha.
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

  const Example = getExample(doc.slug);
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
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0">
        <PageIntro doc={doc} eyebrow="Component field guide" />
        <p className="mt-6 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          <strong className="font-medium text-zinc-950 dark:text-white">
            When to reach for it:
          </strong>{" "}
          {doc.whenToUse}
        </p>
        <ComponentOutline className="mt-8 xl:hidden" compact doc={doc} />

        <div className="mt-14 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-14">
          <ComponentSection
            description="The real component next to the source that produced it."
            id="example"
            number="01"
            title="Try it."
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
              <LiveExample description="Click it, focus it, and use the keys from this page.">
                {Example ? <Example /> : <p>Example unavailable.</p>}
              </LiveExample>
              <CodeBlock code={doc.exampleSource} title={`${doc.title}.tsx`} />
            </div>
          </ComponentSection>

          <ComponentSection
            description="Dashed frames are invisible state providers; shaded shapes own real DOM. Numbered pins match the list below."
            id="anatomy"
            number="02"
            title="Anatomy."
          >
            <Anatomy parts={doc.parts} />
          </ComponentSection>

          <ComponentSection
            description="One part at a time, from the main element to the finished composition."
            id="build"
            number="03"
            title="Build it step by step."
          >
            <StepList steps={doc.steps} />
          </ComponentSection>

          <ComponentSection
            description="What each key does while focus is inside."
            id="keyboard"
            number="04"
            title="Keyboard support."
          >
            {keyboardLesson}
          </ComponentSection>

          <ComponentSection
            description="What gets submitted, what must be labelled, and what assistive technology needs."
            id="contract"
            number="05"
            title="Forms and accessibility."
          >
            <div className="grid gap-8 rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-950/10 sm:p-6 dark:bg-white/3 dark:ring-white/10">
              <section>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Forms and state
                </h3>
                <p className="mt-2 text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                  {doc.form}
                </p>
              </section>
              <section className="border-t border-zinc-950/10 pt-6 dark:border-white/10">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
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
              </section>
            </div>
          </ComponentSection>

          <ComponentSection
            description="Every exported part, what it renders, and the state attributes your CSS can target."
            id="api"
            number="06"
            title="API and styling."
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
              <ApiReference imports={doc.imports} parts={doc.parts} />
              {stylingLesson}
            </div>
          </ComponentSection>
        </div>

        {doc.related.length > 0 && (
          <section className="mt-14 border-t border-zinc-950/10 pt-8 dark:border-white/10">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">Keep exploring</h2>
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
