import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Returns `id` once an element with that id is rendered in the same document as
 * `ref`'s element, and `undefined` before that. Use it for `aria-labelledby` and
 * similar references so they never point at an element that was not rendered
 * (for example a field label the consumer left out). The first render and
 * server output omit the reference; it appears after layout when the target exists.
 *
 * `revalidateOn` is any value that changes when the label may have mounted or
 * unmounted (typically the owning root's context object); the check reruns
 * whenever it changes.
 */
export function useRenderedId(
  ref: RefObject<Element | null>,
  id: string | undefined,
  revalidateOn: unknown,
): string | undefined {
  const [rendered, setRendered] = useState<string | undefined>(undefined);
  useLayoutEffect(() => {
    const exists = id !== undefined && ref.current?.ownerDocument.getElementById(id) != null;
    const next = exists ? id : undefined;
    setRendered((current) => (current === next ? current : next));
  }, [id, ref, revalidateOn]);
  return rendered === id ? rendered : undefined;
}
