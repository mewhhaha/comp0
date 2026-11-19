import { replay } from "../../../examples/genui/replay.js";
import { Link } from "react-router";
import { edits } from "./renderer.server.js";
import { EditRoot } from "./EditRoot.js";
import { initialResponse } from "./responses.js";

export function meta() {
  return [{ title: "GenUI revisions · Labs · comp0" }];
}

export function ServerComponent() {
  return (
    <div className="mx-auto grid max-w-2xl gap-10 px-4 py-12 sm:px-6">
      <header className="grid gap-3">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Labs</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          An answer can change.
        </h1>
        <p className="max-w-[50ch] text-base/7 text-zinc-600 dark:text-zinc-300">
          Write a note, adjust your trip, and open the details. Then let a recorded follow-up revise
          the answer while keeping your work.
        </p>
        <Link
          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
          to="/genui/server#edits"
        >
          How revisions work
        </Link>
      </header>
      <EditRoot>
        <edits.View source={replay(initialResponse)} turn="assistant-1" />
      </EditRoot>
    </div>
  );
}
