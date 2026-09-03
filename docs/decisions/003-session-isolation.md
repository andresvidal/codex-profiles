# ADR-003: Codex session isolation

## Status

Accepted.

## Context

Codex Profiles must allow multiple VS Code windows to use different Codex accounts against the same repository without swapping or rewriting authentication material.

Changing a profile in one window must not mutate an already-running Codex session, and a session must receive an explicit home directory that belongs to the profile selected when the session starts.

## Decision

Each Codex session is launched in a new VS Code terminal with a profile-specific `CODEX_HOME` environment override.

The extension supplies only the `CODEX_HOME` override and otherwise relies on the terminal's normal inherited environment. The command executed in the terminal is the normal `codex` CLI command, so authentication and unauthenticated-profile handling remain owned by Codex.

Profile changes affect only sessions launched after the change. Existing terminals are never rewritten or reconfigured.

The extension does not inspect the selected home to determine authentication state and does not copy, rewrite, or manufacture Codex authentication data.

## Consequences

- Multiple Codex terminals can run concurrently with different homes.
- Selecting another profile does not affect already-running sessions.
- An unauthenticated custom profile follows Codex's normal authentication experience inside its isolated home.
- The `codex` CLI must be available in the user's terminal environment for this launch path.
- Future supported Codex/VS Code integration APIs can replace the terminal launcher behind a small boundary without changing profile storage or session-environment logic.
