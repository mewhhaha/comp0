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
