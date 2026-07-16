import { dataAttr } from "@comp0/core";
import { useState, type DragEvent, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

type DropZoneFile = Pick<File, "name" | "type">;

export type DropZoneProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onDragEnter" | "onDragLeave" | "onDragOver" | "onDrop"
> & {
  /** Comma-separated MIME types, wildcards, or file extensions accepted by this drop zone. */
  accept?: string | undefined;
  disabled?: boolean | undefined;
  /** Receives files only when every dropped file matches accept. */
  onDrop?: ((files: File[]) => void) | undefined;
  /** Receives files when one or more dropped files do not match accept. */
  onDropRejected?: ((files: File[]) => void) | undefined;
  onDragEnter?: ((event: DragEvent<HTMLDivElement>) => void) | undefined;
  onDragLeave?: ((event: DragEvent<HTMLDivElement>) => void) | undefined;
  onDragOver?: ((event: DragEvent<HTMLDivElement>) => void) | undefined;
};

function acceptedFileTypes(accept: string | undefined) {
  return (
    accept
      ?.split(",")
      .map((fileType) => fileType.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

function acceptsFile(file: DropZoneFile, accept: readonly string[]) {
  if (accept.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((acceptedType) => {
    if (acceptedType.startsWith(".")) return name.endsWith(acceptedType);
    if (acceptedType.endsWith("/*")) return type.startsWith(acceptedType.slice(0, -1));
    return type === acceptedType;
  });
}

function dragFiles(event: DragEvent<HTMLDivElement>) {
  const files = [...event.dataTransfer.files];
  if (files.length > 0) return files;

  return [...event.dataTransfer.items]
    .filter((item) => item.kind === "file")
    .map((item) => ({ name: "", type: item.type }));
}

function containsFiles(event: DragEvent<HTMLDivElement>) {
  return [...event.dataTransfer.types].includes("Files") || dragFiles(event).length > 0;
}

export function DropZone({
  accept,
  children,
  disabled: disabledProp,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onDropRejected,
  ref,
  ...props
}: DropZoneProps & RefProp<HTMLDivElement>) {
  const [dragDepth, setDragDepth] = useState(0);
  const [dragAccepted, setDragAccepted] = useState(false);
  const [dragRejected, setDragRejected] = useState(false);
  const acceptedTypes = acceptedFileTypes(accept);
  const disabled = Boolean(disabledProp);
  const active = dragDepth > 0;

  const clearDragState = () => {
    setDragDepth(0);
    setDragAccepted(false);
    setDragRejected(false);
  };

  const acceptsDraggedFiles = (event: DragEvent<HTMLDivElement>) =>
    dragFiles(event).every((file) => acceptsFile(file, acceptedTypes));

  return (
    <div
      {...props}
      ref={ref}
      aria-disabled={disabled || undefined}
      data-slot="drop-zone"
      data-drop-target={dataAttr(active)}
      data-accept={dataAttr(active && dragAccepted)}
      data-reject={dataAttr(active && dragRejected)}
      data-disabled={dataAttr(disabled)}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (event.defaultPrevented || disabled || !containsFiles(event)) return;

        event.preventDefault();
        const accepted = acceptsDraggedFiles(event);
        setDragDepth((depth) => depth + 1);
        setDragAccepted(accepted);
        setDragRejected(!accepted);
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (event.defaultPrevented || disabled || !containsFiles(event)) return;

        setDragDepth((depth) => {
          const nextDepth = Math.max(0, depth - 1);
          if (nextDepth === 0) {
            setDragAccepted(false);
            setDragRejected(false);
          }
          return nextDepth;
        });
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented || disabled || !containsFiles(event)) return;

        event.preventDefault();
        const accepted = acceptsDraggedFiles(event);
        if (event.dataTransfer) event.dataTransfer.dropEffect = accepted ? "copy" : "none";
        setDragAccepted(accepted);
        setDragRejected(!accepted);
      }}
      onDrop={(event) => {
        if (disabled || !containsFiles(event)) return;

        event.preventDefault();
        const files = [...event.dataTransfer.files];
        const accepted = files.every((file) => acceptsFile(file, acceptedTypes));
        clearDragState();
        if (accepted) onDrop?.(files);
        else onDropRejected?.(files);
      }}
    >
      {children}
    </div>
  );
}
