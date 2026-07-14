import { useState } from "react";
import {
  Description,
  FieldError,
  Label,
  PasswordField,
  PasswordFieldInput,
  PasswordFieldToggle,
} from "@comp0/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid";

export function Example() {
  const [hasValidationError, setHasValidationError] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  return (
    <form
      className="flex max-w-sm flex-col gap-5 rounded-xl border border-zinc-950/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        setSignedIn(true);
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Sign in</h2>
        <p className="mt-1 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Enter the password for ada@example.com.
        </p>
      </div>
      <PasswordField
        as="div"
        className="flex flex-col gap-1.5"
        invalid={hasValidationError}
        onChange={() => setHasValidationError(false)}
        required
      >
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Password
        </Label>
        <div className="relative">
          <PasswordFieldInput
            autoComplete="current-password"
            className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 pr-24 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:outline-teal-400"
            name="password"
            onInvalid={() => setHasValidationError(true)}
          />
          <PasswordFieldToggle className="absolute top-1/2 right-1 flex h-8 -translate-y-1/2 items-center justify-center gap-1.5 rounded px-2 text-sm font-medium text-zinc-500 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 dark:text-zinc-400 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
            {({ passwordVisible }) => {
              if (passwordVisible) {
                return (
                  <>
                    <EyeSlashIcon className="size-4" aria-hidden="true" />
                    Hide
                  </>
                );
              }
              return (
                <>
                  <EyeIcon className="size-4" aria-hidden="true" />
                  Show
                </>
              );
            }}
          </PasswordFieldToggle>
        </div>
        <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          You can paste a password or use your password manager.
        </Description>
        <FieldError className="text-base text-red-600 sm:text-sm dark:text-red-400">
          Enter your password to sign in.
        </FieldError>
      </PasswordField>
      <button
        className="rounded bg-teal-600 px-3 py-2.5 text-base font-medium text-white outline-teal-600 hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 sm:py-2 sm:text-sm dark:bg-teal-500 dark:hover:bg-teal-400"
        type="submit"
      >
        Sign in
      </button>
      {signedIn && (
        <p className="text-base text-emerald-700 sm:text-sm dark:text-emerald-400" role="status">
          Signed in.
        </p>
      )}
    </form>
  );
}
