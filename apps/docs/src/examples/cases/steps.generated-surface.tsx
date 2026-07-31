import { useEffect, useState } from "react";
import {
  Button,
  Status,
  Steps,
  StepsItem,
  StepsList,
  StepsPanel,
  StepsTrigger,
} from "@comp0/react";

type SurfaceNode =
  | { id: string; kind: "heading"; text: string }
  | { id: string; kind: "summary"; text: string }
  | {
      id: string;
      kind: "plan";
      steps: readonly { value: string; title: string; detail: string }[];
    }
  | { id: string; kind: "actions" };

const approvedSurface: readonly SurfaceNode[] = [
  { id: "heading", kind: "heading", text: "Release proposal" },
  {
    id: "summary",
    kind: "summary",
    text: "The agent proposed a three-step release using only components registered by the app.",
  },
  {
    id: "plan",
    kind: "plan",
    steps: [
      { value: "review", title: "Review", detail: "Review 14 changed files and two migrations." },
      { value: "test", title: "Test", detail: "Run unit, browser, and package-consumer checks." },
      { value: "publish", title: "Publish", detail: "Publish after an explicit human approval." },
    ],
  },
  { id: "actions", kind: "actions" },
];

export function Example() {
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("review");
  const [decision, setDecision] = useState("");

  useEffect(() => {
    if (!generating) return;
    if (visibleNodes >= approvedSurface.length) {
      setGenerating(false);
      return;
    }
    const timer = setTimeout(() => setVisibleNodes((current) => current + 1), 350);
    return () => clearTimeout(timer);
  }, [generating, visibleNodes]);

  const generateSurface = () => {
    setVisibleNodes(0);
    setCurrentStep("review");
    setDecision("");
    setGenerating(true);
  };

  let announcement = "Choose Generate interface to start.";
  if (generating) announcement = "Generating interface from approved components.";
  if (!generating && visibleNodes === approvedSurface.length) announcement = "Interface ready.";
  if (decision) announcement = decision;

  return (
    <section aria-labelledby="generated-ui-title" className="w-full max-w-xl">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h2 id="generated-ui-title" className="font-semibold text-zinc-950 dark:text-white">
            Release interface generator
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            A typed registry maps streamed descriptions to trusted components—never arbitrary code.
          </p>
        </div>
        <Button
          disabled={generating}
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-300"
          onClick={generateSurface}
        >
          {visibleNodes === 0 ? "Generate interface" : "Generate again"}
        </Button>
      </div>
      <Status className="mt-3 text-sm text-zinc-600 dark:text-zinc-400" aria-atomic="true">
        {announcement}
      </Status>
      <div
        aria-busy={generating || undefined}
        className="mt-4 min-h-72 rounded-xl border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      >
        {visibleNodes === 0 && !generating && (
          <p className="grid min-h-56 place-items-center text-sm text-zinc-500 dark:text-zinc-400">
            Generated components appear here.
          </p>
        )}
        <div className="grid gap-4">
          {approvedSurface.slice(0, visibleNodes).map((node) => {
            if (node.kind === "heading") {
              return (
                <h3 key={node.id} className="text-lg font-semibold text-zinc-950 dark:text-white">
                  {node.text}
                </h3>
              );
            }
            if (node.kind === "summary") {
              return (
                <p key={node.id} className="text-sm text-zinc-600 dark:text-zinc-300">
                  {node.text}
                </p>
              );
            }
            if (node.kind === "plan") {
              return (
                <Steps key={node.id} as="div" value={currentStep} onChange={setCurrentStep}>
                  <StepsList aria-label="Generated release plan" className="flex gap-2">
                    {node.steps.map((step) => (
                      <StepsItem key={step.value} value={step.value} className="flex-1">
                        <StepsTrigger className="w-full rounded-lg border border-zinc-950/10 px-2 py-2 text-sm text-zinc-600 outline-teal-600 data-current:border-teal-700 data-current:bg-teal-50 data-current:text-teal-950 focus-visible:outline-2 dark:border-white/10 dark:text-zinc-300 dark:data-current:border-teal-400 dark:data-current:bg-teal-950 dark:data-current:text-teal-50 dark:outline-teal-400">
                          {step.title}
                        </StepsTrigger>
                      </StepsItem>
                    ))}
                  </StepsList>
                  {node.steps.map((step) => (
                    <StepsPanel
                      key={step.value}
                      value={step.value}
                      className="pt-3 text-sm text-zinc-600 dark:text-zinc-300"
                    >
                      {step.detail}
                    </StepsPanel>
                  ))}
                </Steps>
              );
            }
            return (
              <div
                key={node.id}
                className="flex flex-wrap gap-2 border-t border-zinc-950/10 pt-4 dark:border-white/10"
              >
                <Button
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white outline-emerald-700 focus-visible:outline-2 dark:bg-emerald-400 dark:text-zinc-950 dark:outline-emerald-300"
                  onClick={() => setDecision("Release proposal approved.")}
                >
                  Approve plan
                </Button>
                <Button
                  className="rounded-lg border border-zinc-950/15 px-3 py-2 text-sm font-medium outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400"
                  onClick={() => setDecision("Changes requested.")}
                >
                  Request changes
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
