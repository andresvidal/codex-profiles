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
- [x] Logging/output channel
- [x] Unit tests for profile path and Default profile resolution
- [x] CI on Windows, macOS, and Linux

Exit criteria:

Installing the extension preserves the user's existing VS Code environment and Default Codex home while allowing isolated named account homes to be defined.

## Phase 2 — Codex account isolation

Goal: switch Codex accounts without switching the user's development environment.

Deliverables:

- [x] Profile-specific `CODEX_HOME` environment builder
- [x] `Launch Codex CLI` terminal integration
- [x] Normal Codex authentication flow retained for unauthenticated account homes
- [x] Default Codex profile remains untouched
- [x] Shared-vs-isolated Codex configuration mode
- [x] New account homes share Default `config.toml` by default
- [x] Existing reused homes keep isolated configuration by default
- [x] Cross-platform tests for shared configuration projection
- [x] Per-profile VS Code `--user-data-dir` architecture removed
- [ ] Multiple account support validated during real Codex CLI sessions
- [ ] VS Code-host integration test for terminal launch options

Exit criteria:

Two named account homes can authenticate independently and run concurrent Codex CLI sessions while using the same VS Code settings, extensions, workspace, and shared Codex configuration by default.

## Phase 3 — Per-window Codex IDE binding

Goal: let the same repository be open in normal VS Code windows while each Codex IDE runtime uses a different account, without cloning or switching the VS Code user profile.

Deliverables:

- [ ] Identify and validate a supported Codex IDE/app-server runtime binding for account home selection
- [ ] Keep VS Code settings, extensions, themes, keybindings, and extension state shared
- [ ] Bind the selected account to only the Codex runtime in each window
- [ ] Support two simultaneous windows with different Codex accounts against the same repository
- [ ] Define runtime restart/reload behavior when changing the active account
- [ ] Evaluate opaque credential snapshotting only if required by the supported runtime integration
- [ ] Prevent stale-token/refresh races if credential snapshots become necessary
- [ ] Cross-window and cross-platform integration tests
- [ ] Remote SSH / WSL / Dev Container behavior documented

Exit criteria:

The same repository can be open simultaneously in two normal VS Code windows with different Codex ChatGPT accounts while the rest of each window uses the user's existing VS Code environment.

## Phase 4 — Polish

Goal: production readiness and marketplace release.

Deliverables:

- [ ] Profile management UX
- [ ] Rename/delete flows
- [ ] Shared/isolated Codex configuration toggle UX
- [ ] Improved validation and diagnostics
- [ ] Unit and integration test coverage
- [ ] Generate lockfile and migrate CI to `npm ci`
- [ ] CI/release workflow
- [ ] Marketplace icon and screenshots
- [ ] Marketplace metadata
- [ ] Changelog and release notes
- [ ] Windows/macOS/Linux manual verification
- [ ] Telemetry decision documented
