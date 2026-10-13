import { GenUIView } from "@comp0/genui/rsc";
import { Link } from "react-router";
import { editState, editVocabulary } from "./contract.js";
import { EditRoot } from "./EditRoot.js";
import { initialResponse, replay } from "./responses.js";

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
          to="/genui/server"
        >
          How revisions work
        </Link>
      </header>
      <EditRoot>
        <GenUIView
          vocabulary={editVocabulary}
          state={editState}
          stream={replay(initialResponse)}
          turn="assistant-1"
        />
      </EditRoot>
    </div>
  );
}
