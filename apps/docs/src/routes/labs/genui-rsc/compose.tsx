import { Form, Link } from "react-router";
import { labUI } from "./contract.js";
import { labRenderer } from "./components.server.js";
import { LabRoot } from "./LabRoot.js";

const example = `<Stack gap="md">
  <Heading>Forecast explorer</Heading>
  <Select label="City" bind="city">
    <Option value="Oslo">Oslo</Option>
    <Option value="Tokyo">Tokyo</Option>
  </Select>
  <Forecast city={city} />
</Stack>`;
const maxLength = 4000;

export function meta() {
  return [{ title: "Compose an interface · comp0" }];
}

export function loader({ request }: { request: Request }) {
  const source = new URL(request.url).searchParams.get("source") ?? example;
  if (source.length > maxLength)
    throw new Response("The example exceeds 4,000 characters.", { status: 400 });
  return { source };
}

export function ServerComponent({ loaderData }: { loaderData: { source: string } }) {
  const { source } = loaderData;
  const { errors } = labUI.validate(source);
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6">
      <header className="grid gap-2">
        <Link className="text-sm underline" to="/genui/server">
          GenUI component contracts
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Compose an interface</h1>
        <p>
          Change the JSX and preview it. The Forecast component reads the city selected in the form.
        </p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <Form method="get" className="grid gap-3">
          <label className="font-semibold" htmlFor="composition-source">
            Component JSX
          </label>
          <textarea
            key={source}
            id="composition-source"
            name="source"
            maxLength={maxLength}
            defaultValue={source}
            rows={12}
            spellCheck={false}
            className="w-full rounded-md border border-zinc-400 bg-transparent p-3 font-mono text-sm/6"
          />
          <button
            type="submit"
            className="justify-self-start rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
          >
            Preview
          </button>
        </Form>
        <section aria-label="Preview" className="min-w-0">
          {errors.length > 0 && (
            <div aria-live="polite">
              <h2 className="font-semibold">Check the JSX</h2>
              <ul className="list-disc ps-5">
                {errors.map((error, index) => (
                  <li key={index}>
                    {error.message} <code>{error.path}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div data-intelligent-ui="">
            <LabRoot key={source}>
              <labRenderer.View source={source} />
            </LabRoot>
          </div>
        </section>
      </div>
      <details className="min-w-0">
        <summary className="cursor-pointer font-semibold">Model prompt for this vocabulary</summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">
          {labUI.prompt()}
        </pre>
      </details>
    </div>
  );
}
