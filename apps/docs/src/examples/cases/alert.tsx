import { useState } from "react";
import { Alert, Button } from "@comp0/react";

export function Example() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex w-80 flex-col items-start gap-3 text-base sm:text-sm">
      <Button
        className="min-h-10 rounded-lg bg-teal-700 px-3 py-2 font-medium text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-zinc-950 dark:focus-visible:outline-teal-300"
        onClick={() => setFailed(true)}
      >
        Process payment
      </Button>
      {failed && (
        <Alert className="w-full rounded-lg border border-red-600/30 bg-red-50 p-3 text-red-900 dark:border-red-400/30 dark:bg-red-950 dark:text-red-100">
          Payment failed. Check the card details and try again.
        </Alert>
      )}
    </div>
  );
}
