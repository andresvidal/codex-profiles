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
- [x] Codex CLI terminal launch integration
- [x] Normal Codex authentication flow retained for unauthenticated profiles
- [ ] Multiple profile support validated during real Codex sessions
- [x] Switching applies only to newly launched sessions
- [x] Unit tests proving environment isolation
- [ ] VS Code-host integration test for terminal launch options

Exit criteria:

Two profiles can authenticate independently through Codex and launch separate sessions without copying or swapping credential material.

## Phase 3 — Workspace duplication

Goal: open the same repository in another VS Code window with a different profile.

Deliverables:

- [ ] `Open Workspace With Profile…` command
- [ ] New-window launch flow
- [ ] Explicit profile handoff to the new window
- [ ] No process-global or shared-workspace active-profile state
- [ ] Multi-root workspace behavior documented
- [ ] Cross-platform tests

Exit criteria:

The same repository can be open simultaneously in separate VS Code windows, each launching Codex with a different profile.

## Phase 4 — Polish

Goal: production readiness and marketplace release.

Deliverables:

- [ ] Profile management UX
- [ ] Rename/delete flows
- [ ] Improved validation and diagnostics
- [ ] Unit and integration test coverage
- [ ] CI/release workflow
- [ ] Marketplace icon and screenshots
- [ ] Marketplace metadata
- [ ] Changelog and release notes
- [ ] Windows/macOS/Linux verification
- [ ] Telemetry decision documented
