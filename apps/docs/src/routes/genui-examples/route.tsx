import { createRenderer } from "@comp0/genui/rsc";
import { Link } from "react-router";
import { LessonPager } from "../../components/teaching/LessonPager.js";
import { CodeBlock } from "../../components/teaching/CodeBlock.js";
import {
  contracts,
  hasComposition,
  printProof,
  seatingPlan,
  type CompositionSlug,
} from "../../examples/genui/gallery/contracts.js";
import { examples, type GalleryExample } from "../../examples/genui/gallery/examples.js";
import { PrintProof } from "../../examples/genui/gallery/PrintProof.js";
import { SeatingPlan } from "../../examples/genui/gallery/SeatingPlan.js";
import { MuseumDisplay } from "./MuseumDisplay.js";
import { ExampleRoot } from "./ExampleRoot.js";
import { HostCode } from "./HostCode.js";
import { JsonExample } from "./JsonExample.js";
import { station } from "./station.server.js";

function rendererFor(slug: CompositionSlug) {
  if (slug === "night-train") return station;
  if (slug === "print-proof")
    return createRenderer(contracts[slug], printProof.implement(PrintProof));
  if (slug === "listening-room")
    return createRenderer(contracts[slug], seatingPlan.implement(SeatingPlan));
  return createRenderer(contracts[slug]);
}

type ExampleViewProps = { example: GalleryExample };
function ExampleView({ example }: ExampleViewProps) {
  const { slug, source, revision } = example;
  if (example.format === "json")
    return <JsonExample key={slug} source={source} inventory={slug === "record-crates"} />;
  if (!hasComposition(slug)) throw new Error("Missing GenUI composition: " + slug);
  if (slug === "museum-label") return <MuseumDisplay source={source} />;
  const renderer = rendererFor(slug);
  return (
    <ExampleRoot
      key={slug}
      slug={slug}
      revision={
        revision && <renderer.View source={revision} history={[source]} turn="band-encore" />
      }
    >
      <renderer.View source={source} />
    </ExampleRoot>
  );
}

type ExampleRouteProps = { params: { example?: string } };
function findExample({ params }: ExampleRouteProps) {
  const example = examples.find((item) => item.slug === params.example);
  if (!example) throw new Response("Example not found", { status: 404 });
  return example;
}

export function loader(props: ExampleRouteProps) {
  const { title, prompt } = findExample(props);
  return { title, prompt };
}

export function meta({ loaderData }: { loaderData?: ReturnType<typeof loader> }) {
  if (!loaderData) return [{ title: "Example not found · GenUI · comp0" }];
  return [
    { title: loaderData.title + " · GenUI examples · comp0" },
    { name: "description", content: loaderData.prompt },
  ];
}

export function ServerComponent(props: ExampleRouteProps) {
  const example = findExample(props);
  const language = example.format ?? "jsx";
  const index = examples.indexOf(example);
  const previous = examples[index - 1];
  const next = examples[index + 1];
  return (
    <article className="mx-auto grid max-w-3xl gap-8 px-4 py-12 sm:px-6">
      <header className="grid gap-3">
        <Link
          className="w-fit text-sm font-semibold text-teal-800 underline underline-offset-4 dark:text-teal-200"
          to="/genui/examples"
        >
          GenUI examples
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {example.title}
        </h1>
        <blockquote className="max-w-prose border-l-2 border-zinc-300 pl-3 text-lg text-zinc-700 dark:text-zinc-300">
          “{example.prompt}”
        </blockquote>
      </header>
      <section className="min-w-0" aria-labelledby="preview-title">
        <h2 id="preview-title" className="text-xl font-semibold">
          Live example
        </h2>
        <p className="mt-2 max-w-prose text-zinc-700 dark:text-zinc-300">{example.tryIt}</p>
        <div
          data-genui=""
          className="mt-4 min-w-0 rounded-xl border border-zinc-300 p-4 sm:p-6 dark:border-zinc-700"
        >
          <ExampleView example={example} />
        </div>
      </section>
      <details key={example.slug} className="min-w-0">
        <summary className="w-fit cursor-pointer py-2 text-lg font-semibold">
          Model response
        </summary>
        <p className="mt-2 max-w-prose">{example.mechanism}</p>
        <CodeBlock
          title="Recorded response"
          language={language}
          code={example.source}
          className="mt-3"
        />
        {example.revision && (
          <CodeBlock
            title="Band’s follow-up"
            language="jsx"
            code={example.revision}
            className="mt-4"
          />
        )}
      </details>
      <HostCode key={"host-" + example.slug} slug={example.slug} />
      <LessonPager
        previous={previous && { title: previous.title, to: "/genui/examples/" + previous.slug }}
        next={next && { title: next.title, to: "/genui/examples/" + next.slug }}
      />
    </article>
  );
}
