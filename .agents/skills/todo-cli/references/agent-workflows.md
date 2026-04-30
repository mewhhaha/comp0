# Agent Workflows

Use tickets to make delegation explicit. A good ticket is small enough for one agent to finish and verify without needing new product decisions.

## Creating Work for Subagents

Create tickets with:

- A title that names the concrete outcome.
- A body containing acceptance criteria, likely files, and the verification command.
- A priority where larger numbers should be claimed first.
- `--depends-on` only when the task is genuinely blocked by another ticket.

Example:

```bash
cargo run -- add "Add blocked-claim integration test" \
  --body "Verify claim skips tickets whose dependency is not done. Run cargo test." \
  --priority 30
```

## Dispatching Work

Before spawning or instructing a subagent, claim a ticket for that worker:

```bash
cargo run -- claim --agent "worker-1" --json
```

Pass the claimed ticket ID, title, body, and acceptance criteria to the subagent. The subagent should treat the ticket as the scope boundary.

## Completing Work

When the ticket is finished:

```bash
cargo run -- done <id> --notes "Changed X. Verified with cargo test."
```

Completion notes should include the smallest proof that the work is true: test command, build command, screenshot check, manual reproduction, or reason verification was not possible.

## Handling Interruptions

If claimed work cannot continue, reopen it:

```bash
cargo run -- reopen <id>
```

If the work should no longer be done, cancel it:

```bash
cargo run -- cancel <id> --reason "Superseded by ticket #9."
```

## Suggested Session Pattern

1. `cargo run -- list --status active --json`
2. Add or refine tickets until each one has a clear acceptance check.
3. Claim tickets for active workers.
4. Track progress with `list --status running`.
5. Mark tickets done only after verification.
6. Finish by checking `list --status active`.
