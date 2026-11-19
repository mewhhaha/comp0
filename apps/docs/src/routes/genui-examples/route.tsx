import { Link } from "react-router";
import { LessonPager } from "../../components/teaching/LessonPager.js";
import { CodeBlock } from "../../components/teaching/CodeBlock.js";
import { examples } from "../../examples/genui/gallery/examples.js";
import { Conversation } from "./Conversation.js";
import { HostCode } from "./HostCode.js";

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
    <article key={example.slug} className="mx-auto grid max-w-3xl gap-8 px-4 py-12 sm:px-6">
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
      </header>
      <Conversation
        slug={example.slug}
        prompt={example.prompt}
        followUp={example.followUp?.prompt}
      />
      <details className="min-w-0">
        <summary className="w-fit cursor-pointer py-2 text-lg font-semibold">
          Response source
        </summary>
        <p className="mt-2 max-w-prose">{example.mechanism}</p>
        <CodeBlock
          title="Recorded response"
          language={language}
          code={example.source}
          className="mt-3"
        />
        {example.followUp && (
          <CodeBlock
            title="Band’s follow-up"
            language="jsx"
            code={example.followUp.source}
            className="mt-4"
          />
        )}
      </details>
      <HostCode slug={example.slug} />
      <LessonPager
        previous={previous && { title: previous.title, to: "/genui/examples/" + previous.slug }}
        next={next && { title: next.title, to: "/genui/examples/" + next.slug }}
      />
    </article>
  );
}
