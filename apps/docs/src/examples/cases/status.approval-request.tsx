import { useEffect, useState } from "react";
import { Button, Disclosure, DisclosurePanel, DisclosureTrigger, Status } from "@comp0/react";

type ApprovalState = "pending" | "submitting" | "approved" | "rejected";

const stateLabels: Record<ApprovalState, string> = {
  pending: "Approval needed",
  submitting: "Applying decision",
  approved: "Approved",
  rejected: "Rejected",
};

export function Example() {
  const [approvalState, setApprovalState] = useState<ApprovalState>("pending");

  useEffect(() => {
    if (approvalState !== "submitting") return;
    const timer = setTimeout(() => setApprovalState("approved"), 800);
    return () => clearTimeout(timer);
  }, [approvalState]);

  const pending = approvalState === "pending";
  const submitting = approvalState === "submitting";
  const resolved = approvalState === "approved" || approvalState === "rejected";

  return (
    <section
      aria-labelledby="approval-title"
      aria-busy={submitting || undefined}
      className="w-full max-w-md rounded-xl border border-amber-600/25 bg-amber-50 p-4 text-zinc-950 dark:border-amber-400/25 dark:bg-amber-950/40 dark:text-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="approval-title" className="font-semibold">
            Publish three documentation pages?
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            This action updates the public production site.
          </p>
        </div>
        <span
          aria-hidden="true"
          data-state={approvalState}
          className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 data-[state=approved]:bg-emerald-100 data-[state=approved]:text-emerald-900 data-[state=rejected]:bg-rose-100 data-[state=rejected]:text-rose-900 dark:bg-amber-900 dark:text-amber-100 dark:data-[state=approved]:bg-emerald-900 dark:data-[state=approved]:text-emerald-100 dark:data-[state=rejected]:bg-rose-900 dark:data-[state=rejected]:text-rose-100"
        >
          {stateLabels[approvalState]}
        </span>
      </div>
      <Disclosure className="mt-3 border-t border-amber-900/10 pt-3 dark:border-amber-100/10">
        <DisclosureTrigger className="cursor-pointer text-sm font-medium outline-teal-600 focus-visible:outline-2 dark:outline-teal-400">
          Review requested changes
        </DisclosureTrigger>
        <DisclosurePanel className="pt-2 text-sm text-zinc-600 dark:text-zinc-300">
          <ul className="list-disc space-y-1 pl-5">
            <li>Publish the Charts, Messages, and Tree pages.</li>
            <li>Invalidate the documentation cache.</li>
            <li>Keep the previous deployment available for rollback.</li>
          </ul>
        </DisclosurePanel>
      </Disclosure>
      <div className="mt-4 flex flex-wrap gap-2">
        {!resolved && (
          <>
            <Button
              disabled={!pending}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white outline-emerald-700 focus-visible:outline-2 disabled:opacity-50 dark:bg-emerald-400 dark:text-zinc-950 dark:outline-emerald-300"
              onClick={() => setApprovalState("submitting")}
            >
              {submitting ? "Approving…" : "Approve publish"}
            </Button>
            <Button
              disabled={!pending}
              className="rounded-lg border border-zinc-950/15 px-3 py-2 text-sm font-medium outline-rose-600 focus-visible:outline-2 disabled:opacity-50 dark:border-white/15 dark:outline-rose-400"
              onClick={() => setApprovalState("rejected")}
            >
              Reject
            </Button>
          </>
        )}
        {resolved && (
          <Button
            className="rounded-lg border border-zinc-950/15 px-3 py-2 text-sm font-medium outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400"
            onClick={() => setApprovalState("pending")}
          >
            Reset example
          </Button>
        )}
      </div>
      <Status className="sr-only" aria-atomic="true">
        {stateLabels[approvalState]}
      </Status>
    </section>
  );
}
