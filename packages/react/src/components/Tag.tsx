import { useCallback, useContext, useId, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { TagListContext } from "./TagList.js";

export type TagProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  id?: string | undefined;
  disabled?: boolean | undefined;
};

export function Tag({
  id,
  disabled,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TagProps & RefProp<HTMLDivElement>) {
  const tagList = useContext(TagListContext);
  const generatedId = useId();
  const key = id ?? generatedId;
  const resolvedDisabled = Boolean(disabled);
  const active = tagList?.activeKey === key;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (!tagList || active) tabIndex = 0;

  const tagRef = useCallback(
    (element: HTMLDivElement | null) => {
      tagList?.register(key, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [key, ref, resolvedDisabled, tagList],
  );

  return (
    <div
      {...props}
      ref={tagRef}
      id={key}
      role="listitem"
      tabIndex={tabIndex}
      data-disabled={dataAttr(resolvedDisabled)}
      data-focused={dataAttr(active)}
      data-slot="tag"
      data-value={key}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) tagList?.setActiveKey(key);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Backspace" && event.key !== "Delete") return;
        if (!tagList?.remove) return;
        event.preventDefault();
        tagList.remove(key);
      }}
    >
      {children}
    </div>
  );
}
