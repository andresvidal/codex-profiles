# Codex Profiles

Codex Profiles is a VS Code extension for working with multiple OpenAI Codex profiles cleanly.

The goal is to let the same repository be open in separate VS Code windows, with each window using a different Codex account/profile.

## Principles

- No token swapping or authentication hacks.
- Prefer isolated `CODEX_HOME` directories for profiles.
- Treat each VS Code window as an independent profile/session boundary.
- Keep authentication owned by Codex.
- Preserve the user's existing Codex home by default.
- Never delete Codex profile data during extension uninstall.
- Use TypeScript, strict typing, and small modular files.
- Document important architectural decisions and trade-offs.
- Prefer supported APIs over undocumented internals.

## Profiles

Codex Profiles always exposes an implicit `Default` profile.

- If `CODEX_HOME` is already set, `Default` uses that value.
- Otherwise `Default` resolves to the normal user Codex home at `~/.codex`.
- Installing, disabling, or uninstalling the extension does not move, rewrite, or delete that directory.

Use **Codex Profiles: Create Profile** to add another profile. The extension asks for a profile name, proposes an isolated home such as `~/.codex-profiles/work`, and lets you edit the path before creating it. Existing directories require explicit confirmation before use.

Custom profile directories are user data. They remain on disk if the extension is disabled or uninstalled.

## Launching Codex

Use **Codex Profiles: Launch Codex** to start a Codex CLI session for the profile currently selected in that VS Code window.

The extension creates a new terminal named after the profile, sets that terminal's `CODEX_HOME` to the profile home, and runs the normal `codex` command. The terminal starts in the current workspace when one is open.

Switching profiles affects only future launches. An already-running Codex terminal keeps the environment it received when it was created, so multiple terminals can remain open with different profiles at the same time.

If a custom profile has not authenticated yet, authentication remains part of Codex's normal CLI flow inside that isolated `CODEX_HOME`. Codex Profiles does not inspect or manipulate authentication files.

The `codex` CLI must be available from the user's terminal environment.

## Roadmap

### Phase 1 — Foundation

- VS Code extension scaffold
- Profile configuration
- Built-in Default profile
- Profile creation and selection commands
- Active-profile state
- Status bar
- Architecture documentation

### Phase 2 — Profile switching

- Profile-specific `CODEX_HOME`
- Per-session Codex launching
- Multiple profiles
- Safe switching between profiles

### Phase 3 — Workspace duplication

Open the same repository in a new VS Code window using a different Codex profile.

### Phase 4 — Polish

- Tests
- Profile management UX
- Documentation
- Marketplace assets
- Packaging and release automation

## Authentication boundary

Codex Profiles does not copy, modify, inspect, or swap authentication tokens.

Profiles rely on supported Codex isolation mechanisms such as separate `CODEX_HOME` directories. Authentication remains owned by Codex.

## Development

```bash
npm install
npm run ci
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host after installing dependencies.

## Status

Early development.

## License

MIT
