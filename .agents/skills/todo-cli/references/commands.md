# Todo CLI Commands

The binary is named `todo`. During development, use `cargo run -- <command>`. After installing or building, use `todo <command>`.

All commands must run inside a Git repository. The CLI walks upward from the current directory, uses the nearest `.git` marker as the root, and stores data in `.todo/todo.db`.

## Add

```bash
cargo run -- add <title> [--body <text>] [--priority <n>] [--parent <id>] [--depends-on <id>] [--json]
```

Creates an `open` ticket.

Example:

```bash
cargo run -- add "Write integration test" \
  --body "Cover claim ordering and blocked dependencies." \
  --priority 20 \
  --json
```

## List

```bash
cargo run -- list [--status active|open|running|done|cancelled|all] [--json]
```

Defaults to `active`, which includes `open` and `running`.

Useful forms:

```bash
cargo run -- list
cargo run -- list --status open --json
cargo run -- list --status all
```

## Show

```bash
cargo run -- show <id> [--json]
```

Displays one ticket. Use `--json` when extracting fields.

## Claim

```bash
cargo run -- claim [id] [--agent <name>] [--json]
```

Without an ID, claims the highest-priority unblocked open ticket, breaking ties by oldest creation time. Claiming sets `status` to `running`, records `started_at`, and sets `claimed_by` when `--agent` is provided.

With an ID, the ticket must be `open` and unblocked.

Examples:

```bash
cargo run -- claim --agent "subagent-a" --json
cargo run -- claim 12 --agent "reviewer"
```

## Done

```bash
cargo run -- done <id> [--notes <text>] [--json]
```

Marks an `open` or `running` ticket as `done`, sets `completed_at`, and stores optional completion notes.

## Cancel

```bash
cargo run -- cancel <id> [--reason <text>] [--json]
```

Marks a ticket as `cancelled` and stores an optional reason.

## Reopen

```bash
cargo run -- reopen <id> [--json]
```

Moves a `running`, `done`, or `cancelled` ticket back to `open`. This clears `started_at`, `completed_at`, `claimed_by`, completion notes, and cancel reason.

## JSON Shape

Single-ticket commands return a ticket object:

```json
{
  "id": 1,
  "title": "Write integration test",
  "body": "Cover claim ordering.",
  "status": "open",
  "priority": 20,
  "created_at": "2026-04-27T10:00:00Z",
  "started_at": null,
  "completed_at": null,
  "updated_at": "2026-04-27T10:00:00Z",
  "claimed_by": null,
  "parent_id": null,
  "depends_on": null,
  "completion_notes": null,
  "cancel_reason": null
}
```

`list --json` returns:

```json
{
  "tickets": []
}
```
