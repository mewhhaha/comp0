export function dataSlot(props: Record<string, unknown>, fallback: string) {
  return (props["data-slot"] as string | undefined) ?? fallback;
}

export type CommandAttributeProps = {
  command?:
    | "show-popover"
    | "hide-popover"
    | "toggle-popover"
    | "show-modal"
    | "close"
    | `--${string}`
    | (string & {})
    | undefined;
  commandfor?: string | undefined;
};
