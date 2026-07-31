import { useState, type FormEvent } from "react";
import {
  Button,
  FloatingPanel,
  FloatingPanelClose,
  FloatingPanelGroup,
  FloatingPanelHeader,
  FloatingPanelSurface,
  FloatingPanelTitle,
  FloatingPanelTrigger,
  Label,
  Messages,
  TextArea,
  TextField,
} from "@comp0/react";

type Comment = {
  id: number;
  author: string;
  body: string;
};

const initialComments: Comment[] = [
  { id: 1, author: "Mina", body: "Should this promise a specific response time?" },
  { id: 2, author: "You", body: "Good catch. I’ll make the wording measurable." },
];

export function Example() {
  const [comments, setComments] = useState(initialComments);
  const [reply, setReply] = useState("");
  const [resolved, setResolved] = useState(false);

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setComments((current) => [...current, { id: current.length + 1, author: "You", body }]);
    setReply("");
  };

  return (
    <FloatingPanelGroup
      as="div"
      className="relative min-h-[40rem] overflow-hidden rounded-xl border border-zinc-950/10 bg-zinc-100 p-5 dark:border-white/10 dark:bg-zinc-950"
    >
      <article className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
        <p className="text-xs font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
          Launch brief
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
          Support that stays ahead of demand
        </h2>
        <p className="mt-3 text-sm/6 text-zinc-600 dark:text-zinc-300">
          Every customer gets a clear answer quickly, with specialists available when the problem
          needs deeper investigation.
        </p>
        <FloatingPanel defaultOpen>
          <div className="relative mt-5 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm/6 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            Most requests receive a complete response in under two hours.
            <FloatingPanelTrigger className="absolute -top-3 -right-3 grid size-7 place-items-center rounded-full bg-amber-500 text-xs font-bold text-amber-950 shadow outline-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-amber-300 dark:outline-amber-300">
              <span aria-hidden="true">{comments.length}</span>
              <span className="sr-only">Open comments about response time</span>
            </FloatingPanelTrigger>
          </div>
          <FloatingPanelSurface
            placement="bottom start"
            className="flex max-h-96 w-72 flex-col overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-xl outline-teal-600 data-active:outline-2 dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400"
          >
            <FloatingPanelHeader className="flex cursor-grab items-center gap-2 border-b border-zinc-950/10 px-3 py-2 dark:border-white/10">
              <FloatingPanelTitle className="flex-1 text-sm font-semibold text-zinc-950 dark:text-white">
                Response-time wording
              </FloatingPanelTitle>
              <FloatingPanelClose
                aria-label="Close comments"
                className="rounded px-1.5 py-0.5 text-zinc-500 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-zinc-800"
              >
                <span aria-hidden="true">×</span>
              </FloatingPanelClose>
            </FloatingPanelHeader>
            <Messages
              aria-label="Comments about response time"
              tabIndex={0}
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
            >
              {comments.map((comment) => (
                <article key={comment.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                  <strong className="font-medium text-zinc-950 dark:text-white">
                    {comment.author}
                  </strong>
                  <p className="mt-0.5">{comment.body}</p>
                </article>
              ))}
            </Messages>
            <div className="border-t border-zinc-950/10 p-3 dark:border-white/10">
              {resolved ? (
                <Button
                  className="rounded-lg border border-zinc-950/15 px-3 py-2 text-sm font-medium outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400"
                  onClick={() => setResolved(false)}
                >
                  Reopen thread
                </Button>
              ) : (
                <form className="grid gap-2" onSubmit={submitReply}>
                  <TextField value={reply} onChange={setReply} className="grid gap-1">
                    <Label className="text-sm font-medium text-zinc-950 dark:text-white">
                      Reply
                    </Label>
                    <TextArea
                      rows={2}
                      className="resize-none rounded-lg border border-zinc-950/15 bg-white px-2.5 py-2 text-sm text-zinc-950 outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:outline-teal-400"
                    />
                  </TextField>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!reply.trim()}
                      className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 dark:bg-teal-400 dark:text-zinc-950"
                    >
                      Reply
                    </Button>
                    <Button
                      className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-zinc-800"
                      onClick={() => setResolved(true)}
                    >
                      Resolve
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </FloatingPanelSurface>
        </FloatingPanel>
      </article>
    </FloatingPanelGroup>
  );
}
