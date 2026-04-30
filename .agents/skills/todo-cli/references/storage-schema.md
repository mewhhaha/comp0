# Storage Schema

The CLI creates `.todo/todo.db` under the nearest Git root and initializes this schema idempotently.

Direct database access is not needed for normal orchestration. Prefer CLI commands unless modifying the tool itself or debugging storage state.

## tickets

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Stable ticket ID. |
| `title` | `TEXT NOT NULL` | Short task summary. |
| `body` | `TEXT NOT NULL DEFAULT ''` | Details, acceptance criteria, and notes for assigned agents. |
| `status` | `TEXT NOT NULL` | One of `open`, `running`, `done`, `cancelled`. |
| `priority` | `INTEGER NOT NULL DEFAULT 0` | Higher values are claimed first. |
| `created_at` | `TEXT NOT NULL` | UTC RFC3339 creation timestamp. |
| `started_at` | `TEXT` | Set on claim. |
| `completed_at` | `TEXT` | Set on done. |
| `updated_at` | `TEXT NOT NULL` | Last mutation timestamp. |
| `claimed_by` | `TEXT` | Agent label supplied to `claim --agent`. |
| `parent_id` | `INTEGER` | Optional grouping relationship. |
| `depends_on` | `INTEGER` | Optional dependency ticket ID. |
| `completion_notes` | `TEXT` | Optional notes from `done --notes`. |
| `cancel_reason` | `TEXT` | Optional reason from `cancel --reason`. |

Indexes exist on `status`, `priority`, `created_at`, and `depends_on`.

## Claim Ordering

Automatic claim uses:

1. `status = 'open'`
2. No dependency, or dependency ticket has `status = 'done'`
3. Highest `priority`
4. Oldest `created_at`
5. Lowest `id`

Claims run inside `BEGIN IMMEDIATE` so concurrent agents should not claim the same ticket.
