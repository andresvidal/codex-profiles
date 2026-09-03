# Roadmap

## Phase 1 — Foundation

Goal: establish a small, testable VS Code extension architecture before integrating Codex sessions.

Deliverables:

- [x] TypeScript extension scaffold
- [x] Strict TypeScript configuration
- [x] Profile domain model
- [x] Profile configuration loading and validation
- [x] Window-local active profile state
- [x] Status bar
- [x] Select Profile command
- [x] Show Active Profile command
- [x] Architecture documentation
- [x] Authentication-boundary ADR
- [ ] Logging/output channel
- [ ] Unit tests
- [ ] CI for type checking and tests

Exit criteria:

The extension can define profiles, select one independently for a VS Code window, and display it without touching authentication material.

## Phase 2 — Profile switching

Goal: launch Codex sessions with explicit profile isolation.

Deliverables:

- [ ] Profile creation workflow
- [ ] Path expansion and validation for `codexHome`
- [ ] Profile-specific `CODEX_HOME` environment builder
- [ ] Supported Codex launch integration
- [ ] Graceful handling of unauthenticated profiles
- [ ] Multiple profile support
- [ ] Switching applies only to newly launched sessions
- [ ] Integration tests proving environment isolation

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
