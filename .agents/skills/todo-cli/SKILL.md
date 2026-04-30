---
name: todo-cli
description: Use this skill when orchestrating agent work with the repo-local Rust todo CLI, including creating work tickets, claiming tasks for subagents, marking work done, reopening or cancelling tickets, and reading task state from the Turso-backed .todo database.
---

# Todo CLI Agent Workflow

Use the `todo` CLI to coordinate work in the nearest enclosing Git repository. The tool stores its local Turso database at `.todo/todo.db` under that Git root and creates it automatically on first use.

## Core Loop

1. Inspect active work:

```bash
cargo run -- list
```

2. Create clear, bounded tickets:

```bash
cargo run -- add "Implement focused behavior" --body "Acceptance criteria and key files." --priority 10
```

3. Claim one ticket before working on it:

```bash
cargo run -- claim --agent "$USER"
```

4. Finish with evidence in notes:

```bash
cargo run -- done 1 --notes "Implemented and verified with cargo test."
```

## Operating Rules

- Run commands from anywhere inside the target Git repo; the CLI finds the nearest Git root.
- Prefer `--json` when another agent or script will consume output.
- Give each ticket a concrete title and a body with acceptance criteria, relevant files, and verification expectations.
- Use `--depends-on <id>` for real sequencing dependencies. A blocked ticket cannot be auto-claimed until the dependency is done.
- Claim before editing. If work is abandoned or reassigned, use `reopen`.
- Mark completed work with `done` only after running the smallest useful verification harness.

## References

- Read [references/commands.md](references/commands.md) for exact command syntax and JSON behavior.
- Read [references/agent-workflows.md](references/agent-workflows.md) for practical orchestration patterns.
- Read [references/storage-schema.md](references/storage-schema.md) only when modifying the CLI or querying the database directly.
