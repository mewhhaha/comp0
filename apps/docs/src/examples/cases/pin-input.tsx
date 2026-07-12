import { useState } from "react";
// Integrator: swap for `import { PinInput, PinInputField } from "@comp0/react";`
// once index.ts exports the pin-input barrel.
import { PinInput, PinInputField } from "@comp0/react";

export function Example() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Enter the 6-digit code from your email.");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Verification code
      </p>
      <PinInput
        aria-label="Verification code"
        className="flex gap-2"
        name="otp"
        value={code}
        onChange={(next) => {
          setCode(next);
          setStatus("Enter the 6-digit code from your email.");
        }}
        onComplete={(next) => setStatus(`Checking ${next}…`)}
      >
        {[1, 2, 3, 4, 5, 6].map((digit) => (
          <PinInputField
            key={digit}
            aria-label={`Digit ${digit}`}
            className="size-10 rounded border border-zinc-950/10 bg-white text-center text-lg text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:size-9 sm:text-base dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          />
        ))}
      </PinInput>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">{status}</p>
    </div>
  );
}
