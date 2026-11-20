import { Link } from "react-router";
import { LessonPager } from "../../components/teaching/LessonPager.js";
import { SourcePanel } from "./SourcePanel.js";
import { examples } from "../../examples/genui/gallery/examples.js";
import { Conversation } from "./Conversation.js";
import { hostFiles } from "./host-files.js";

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
  const source = "/genui/examples/" + example.slug + "/source/";
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
      <SourcePanel href={source + "response"} title="Response source">
        <p className="mt-2 max-w-prose">
          {example.mechanism}{" "}
          <Link className="underline underline-offset-4" to="/genui/payloads">
            How this payload reaches the browser
          </Link>
        </p>
      </SourcePanel>
      {hostFiles.has(example.slug) && (
        <SourcePanel href={source + "host"} title="Host implementation" />
      )}
      <Link className="w-fit underline underline-offset-4" to="/genui/styling">
        Style a generated response
      </Link>
      <LessonPager
        previous={previous && { title: previous.title, to: "/genui/examples/" + previous.slug }}
        next={next && { title: next.title, to: "/genui/examples/" + next.slug }}
      />
    </article>
  );
}
