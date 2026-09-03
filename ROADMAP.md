# Roadmap

## Phase 1 — Foundation

Goal: establish a small, testable VS Code extension architecture before integrating Codex sessions.

Deliverables:

- [x] TypeScript extension scaffold
- [x] Strict TypeScript configuration
- [x] Profile domain model
- [x] Profile configuration loading and validation
- [x] Built-in Default profile resolved from `CODEX_HOME` or `~/.codex`
- [x] Non-destructive profile data lifecycle documented
- [x] Profile creation workflow
- [x] Path expansion and validation for `codexHome`
- [x] Window-local active profile state
- [x] Status bar
- [x] Select Profile command
- [x] Create Profile command
- [x] Show Active Profile command
- [x] Architecture documentation
- [x] Authentication-boundary ADR
- [x] Logging/output channel
- [x] Unit tests for profile path and Default profile resolution
- [x] CI for type checking, tests, and compilation

Exit criteria:

The extension starts each VS Code window on the user's existing Codex home, can create and select isolated custom profiles independently for that window, and never touches authentication material or deletes profile directories as part of the extension lifecycle.

## Phase 2 — Profile switching

Goal: launch Codex sessions with explicit profile isolation.

Deliverables:

- [x] Profile-specific `CODEX_HOME` environment builder
- [x] `Launch Codex CLI` terminal integration
- [x] Normal Codex authentication flow retained for unauthenticated profiles
- [ ] Multiple profile support validated during real Codex CLI and IDE sessions
- [x] Switching applies only to newly launched CLI sessions
- [x] Unit tests proving environment isolation
- [ ] VS Code-host integration test for terminal launch options

Exit criteria:

Two profiles can authenticate independently through Codex and launch separate sessions without copying or swapping credential material.

## Phase 3 — Workspace duplication

Goal: open the same repository in another VS Code instance with a different Codex profile before the Codex IDE extension initializes.

Deliverables:

- [x] `Open Workspace With Profile…` command
- [x] New-instance launch flow using a profile-specific `--user-data-dir`
- [x] Selected `CODEX_HOME` applied to the child VS Code process before extension activation
- [x] Explicit active-profile handoff to the new window
- [x] Profile catalog handoff for isolated windows
- [x] VS Code IPC/client routing stripped from child launch environment
- [x] Shared extension installation via supported `--extensions-dir`
- [x] No process-global or shared-workspace active-profile state
- [x] Saved multi-root workspace behavior documented
- [x] Configurable VS Code CLI, user-data root, and extensions directory
- [x] Cross-platform launch-plan tests and CI on Windows, macOS, and Linux
- [ ] Real end-to-end validation with two simultaneously signed-in Codex IDE accounts
- [ ] VS Code-host integration test proving the child extension host receives the selected `CODEX_HOME`
- [ ] Remote SSH / WSL / Dev Container launch design

Exit criteria:

The same local repository can be open simultaneously in separate isolated VS Code instances, each starting with a different profile-specific `CODEX_HOME`, and the current Codex IDE extension is validated to honor that environment for independent ChatGPT accounts.

## Phase 4 — Polish

Goal: production readiness and marketplace release.

Deliverables:

- [ ] Shared profile catalog persistence independent of VS Code user-data directories
- [ ] Profile management UX
- [ ] Rename/delete flows
- [ ] Improved validation and diagnostics
- [ ] Unit and integration test coverage
- [ ] CI/release workflow
- [ ] Marketplace icon and screenshots
- [ ] Marketplace metadata
- [ ] Changelog and release notes
- [ ] Windows/macOS/Linux manual verification
- [ ] Telemetry decision documented
