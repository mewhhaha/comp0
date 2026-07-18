import { useState } from "react";
import {
  Button,
  ErrorSummary,
  ErrorSummaryLink,
  ErrorSummaryList,
  ErrorSummaryTitle,
  FieldError,
  Input,
  Label,
  TextField,
} from "@comp0/react";

export function Example() {
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      className="w-full max-w-md space-y-4 text-base sm:text-sm"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "");
        setInvalid(!email.includes("@"));
      }}
    >
      {invalid && (
        <ErrorSummary className="rounded-lg border border-red-600/30 bg-red-50 p-4 text-red-950 outline-offset-2 focus-visible:outline-2 focus-visible:outline-red-700 dark:border-red-400/30 dark:bg-red-950 dark:text-red-100 dark:focus-visible:outline-red-300">
          <ErrorSummaryTitle className="font-semibold">There is a problem</ErrorSummaryTitle>
          <ErrorSummaryList className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <ErrorSummaryLink className="underline underline-offset-2" href="#summary-email">
                Enter a valid email address
              </ErrorSummaryLink>
            </li>
          </ErrorSummaryList>
        </ErrorSummary>
      )}
      <TextField id="summary-email" invalid={invalid}>
        <Label className="mb-1 block font-medium">Email address</Label>
        <Input
          name="email"
          type="email"
          className="min-h-10 w-full rounded-lg border border-zinc-950/15 bg-white px-3 py-2 outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:bg-zinc-900 dark:outline-teal-400"
        />
        <FieldError className="mt-1 text-red-700 dark:text-red-300">
          Enter a valid email address
        </FieldError>
      </TextField>
      <Button
        type="submit"
        className="min-h-10 rounded-lg bg-teal-700 px-3 py-2 font-medium text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-zinc-950 dark:focus-visible:outline-teal-300"
      >
        Continue
      </Button>
    </form>
  );
}
