import { Button } from "@comp0/react";
import { Toast, ToastDismiss, ToastProvider, ToastRegion, useToast } from "@comp0/react";
import { XMarkIcon } from "@heroicons/react/16/solid";

function Triggers() {
  const { notify } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        className="rounded bg-teal-600 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm"
        onClick={() => notify("Saved")}
      >
        Save
      </Button>
      <Button
        className="rounded border border-red-950/10 px-3 py-2.5 text-base text-red-700 sm:py-2 sm:text-sm dark:border-red-200/10 dark:text-red-300"
        onClick={() =>
          notify("Connection lost. Changes stopped syncing.", { kind: "alert", timeout: null })
        }
      >
        Go offline
      </Button>
    </div>
  );
}

export function Example() {
  return (
    <ToastProvider>
      <Triggers />
      <ToastRegion className="inset-auto right-4 bottom-4 m-0 flex w-72 flex-col gap-2 border-0 bg-transparent p-0">
        {(toast) => (
          <Toast
            toast={toast}
            className="flex items-start justify-between gap-3 rounded border border-zinc-950/10 bg-white p-3 text-base text-zinc-900 shadow-lg sm:text-sm data-[kind=alert]:border-red-600/30 data-[kind=alert]:text-red-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:data-[kind=alert]:border-red-400/30 dark:data-[kind=alert]:text-red-300"
          >
            <span>{toast.content}</span>
            <ToastDismiss className="rounded p-0.5 text-zinc-500 hover:bg-zinc-950/10 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100">
              <XMarkIcon className="size-4" aria-hidden="true" />
            </ToastDismiss>
          </Toast>
        )}
      </ToastRegion>
    </ToastProvider>
  );
}
