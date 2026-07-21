import { useEffect, useState } from "react";
import { Button, ProgressBar, Status, Tree, TreeGroup, TreeItem } from "@comp0/react";

type TaskStatus = "waiting" | "running" | "complete";

type ActivityTask = {
  value: string;
  label: string;
  statuses: readonly TaskStatus[];
  children?: readonly ActivityTask[];
};

const workflow: readonly ActivityTask[] = [
  {
    value: "release",
    label: "Release documentation",
    statuses: ["waiting", "running", "running", "running", "running", "complete"],
    children: [
      {
        value: "build",
        label: "Build packages",
        statuses: ["waiting", "running", "complete", "complete", "complete", "complete"],
      },
      {
        value: "verify",
        label: "Run verification",
        statuses: ["waiting", "waiting", "running", "running", "complete", "complete"],
        children: [
          {
            value: "unit",
            label: "Unit tests",
            statuses: ["waiting", "waiting", "running", "complete", "complete", "complete"],
          },
          {
            value: "browser",
            label: "Browser tests",
            statuses: ["waiting", "waiting", "waiting", "running", "complete", "complete"],
          },
        ],
      },
      {
        value: "publish",
        label: "Publish release",
        statuses: ["waiting", "waiting", "waiting", "waiting", "running", "complete"],
      },
    ],
  },
];

const statusClasses: Record<TaskStatus, string> = {
  waiting: "bg-zinc-300 dark:bg-zinc-600",
  running: "bg-amber-500 ring-4 ring-amber-500/15",
  complete: "bg-emerald-600 dark:bg-emerald-400",
};

const announcements = [
  "Workflow ready.",
  "Building packages.",
  "Packages built. Running unit tests.",
  "Unit tests passed. Running browser tests.",
  "Verification passed. Publishing release.",
  "Release published successfully.",
] as const;

function ActivityTaskRow({ task, step }: { task: ActivityTask; step: number }) {
  const status = task.statuses[step] ?? "waiting";
  return (
    <TreeItem
      value={task.value}
      textValue={`${task.label}, ${status}`}
      aria-current={status === "running" ? "step" : undefined}
      className="grid gap-1 outline-none"
    >
      <span className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-800 [[role=treeitem]:focus-visible>&]:outline-2 [[role=treeitem]:focus-visible>&]:outline-teal-600 [[data-selected]>&]:bg-zinc-100 dark:text-zinc-100 dark:[[role=treeitem]:focus-visible>&]:outline-teal-400 dark:[[data-selected]>&]:bg-zinc-800">
        <span aria-hidden="true" className={`size-2 rounded-full ${statusClasses[status]}`} />
        <span className="flex-1">{task.label}</span>
        <span className="text-xs capitalize text-zinc-600 dark:text-zinc-400">{status}</span>
      </span>
      {task.children && (
        <TreeGroup className="grid gap-1 pl-5">
          {task.children.map((child) => (
            <ActivityTaskRow key={child.value} task={child} step={step} />
          ))}
        </TreeGroup>
      )}
    </TreeItem>
  );
}

export function Example() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState("release");

  useEffect(() => {
    if (!running) return;
    if (step >= announcements.length - 1) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setStep((current) => current + 1), 650);
    return () => clearTimeout(timer);
  }, [running, step]);

  const startWorkflow = () => {
    setStep(0);
    setRunning(true);
  };

  return (
    <section aria-labelledby="activity-title" className="w-full max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="activity-title" className="font-semibold text-zinc-950 dark:text-white">
            Release activity
          </h2>
          <Status className="mt-1 text-sm text-zinc-600 dark:text-zinc-400" aria-atomic="true">
            {announcements[step]}
          </Status>
        </div>
        <Button
          disabled={running}
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-300"
          onClick={startWorkflow}
        >
          {step === 0 ? "Run workflow" : "Run again"}
        </Button>
      </div>
      <ProgressBar
        value={step}
        max={announcements.length - 1}
        aria-label="Release progress"
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <span className="block h-full w-[calc(var(--comp0-progress-value)*100%)] rounded-full bg-teal-700 transition-[width] motion-reduce:transition-none dark:bg-teal-400" />
      </ProgressBar>
      <Tree
        aria-labelledby="activity-title"
        value={selected}
        onChange={setSelected}
        defaultExpanded={["release", "verify"]}
        className="mt-4 grid gap-1 rounded-xl border border-zinc-950/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900"
      >
        {workflow.map((task) => (
          <ActivityTaskRow key={task.value} task={task} step={step} />
        ))}
      </Tree>
    </section>
  );
}
