# ADR-004: Isolate VS Code instances per Codex profile

## Status

Accepted.

## Context

Codex Profiles needs the same repository to be open in multiple VS Code windows while each window starts the Codex IDE extension under a different `CODEX_HOME`.

Launching another window with only `--new-window` is insufficient. VS Code documents that later instances normally inherit environment variables from an already-running instance rather than from the process that invoked the CLI. That would make per-window `CODEX_HOME` unreliable.

VS Code documents `--user-data-dir` as the supported mechanism for running instances with separate environments.

## Decision

`Open Workspace With Profile…` launches the current local workspace through the VS Code CLI with:

- a unique, stable `--user-data-dir` for the selected Codex profile;
- the selected profile's `CODEX_HOME` in the child process environment;
- `--extensions-dir` pointing at the normal shared VS Code extension installation directory;
- an environment handoff containing the selected profile and current profile catalog;
- VS Code IPC/client-routing environment variables removed before launch.

Per-profile VS Code user data defaults to:

```text
~/.codex-profiles/vscode-data/<profile-id>
```

The repository itself is opened in place. It is not copied or duplicated.

The VS Code CLI executable is configurable and defaults to `code`. We do not derive private installation paths from VS Code internals.

## Consequences

### Benefits

- Different profile windows can receive different `CODEX_HOME` values before extension activation.
- The solution uses documented VS Code process-isolation mechanisms.
- Existing Codex authentication data remains untouched.
- The same profile reuses its VS Code user-data directory across launches.
- Installed extension files can be reused instead of copied.

### Trade-offs

- VS Code settings, preferences, UI state, and extension state are isolated between profile user-data directories.
- The extension must hand off profile metadata because VS Code global settings are also isolated by `--user-data-dir`.
- The `code` CLI must be available or configured explicitly.
- Portable Mode overrides `--user-data-dir` and `--extensions-dir` and is not currently supported.
- Remote SSH, WSL, and Dev Container launch flows require separate design work and are not currently supported.
- Multiple windows still share the same repository working tree and can edit the same files concurrently.

## Authentication boundary

This decision does not authorize reading, copying, writing, or transforming Codex authentication material. Codex Profiles supplies only `CODEX_HOME` and launches a supported VS Code instance. Codex remains responsible for authentication inside each home.

## Validation requirement

Unit tests and cross-platform CI validate launch-plan construction, profile handoff, environment isolation, type safety, and compilation. Before marketplace release, manual or automated VS Code-host integration testing must confirm that current Codex IDE extension releases honor the selected `CODEX_HOME` in simultaneously running isolated VS Code instances.
