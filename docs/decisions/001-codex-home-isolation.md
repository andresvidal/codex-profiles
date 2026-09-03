# ADR-001: Use CODEX_HOME for profile isolation

- Status: Accepted
- Date: 2026-09-03

## Context

Codex Profiles needs to support multiple Codex accounts against the same repository, including simultaneous use in separate VS Code windows.

A fragile implementation could simulate switching by copying, renaming, or rewriting authentication artifacts. That would couple the extension to undocumented credential storage and create avoidable security and reliability risks.

Codex supports a home-directory boundary through `CODEX_HOME` in contexts where the environment variable is honored. That gives each profile an isolated Codex state directory while leaving authentication behavior under Codex's control.

## Decision

Codex Profiles will model a profile as an isolated Codex environment and will prefer a separate `CODEX_HOME` per profile.

The extension will not read, copy, rewrite, rename, manufacture, or swap Codex authentication material.

The extension will treat a VS Code window as the active-profile boundary. Profile changes apply to newly launched Codex sessions rather than attempting to mutate already-running sessions.

Before Phase 2 is considered complete, we must verify the supported Codex launch path actually honors the intended `CODEX_HOME` environment on all target platforms.

## Consequences

### Positive

- Authentication remains owned by Codex.
- Profiles can remain logically and physically isolated.
- The extension avoids coupling to private token formats or storage layouts.
- Multiple windows can eventually use different profiles concurrently.

### Trade-offs

- A new profile may require the normal Codex authentication flow.
- The extension depends on supported `CODEX_HOME` behavior and must test that assumption.
- Switching cannot safely retrofit a new identity into a running Codex process; new sessions must be launched with the selected profile.

## Rejected alternatives

### Copy or swap authentication files

Rejected because it is fragile, security-sensitive, and dependent on undocumented implementation details.

### One global active profile

Rejected because it prevents the same repository from being used concurrently in separate windows with different profiles.

### Workspace-scoped active profile setting

Rejected as the primary session state because two windows opened on the same workspace could overwrite each other's selection.
