# Codex Profiles

Codex Profiles is a VS Code extension for working with multiple OpenAI Codex profiles cleanly.

The goal is to let the same repository be open in separate VS Code windows, with each window using a different Codex account/profile.

## Principles

- No token swapping or authentication hacks.
- Prefer isolated `CODEX_HOME` directories for profiles.
- Treat each VS Code window as an independent profile/session boundary.
- Keep authentication owned by Codex.
- Use TypeScript, strict typing, and small modular files.
- Document important architectural decisions and trade-offs.
- Prefer supported APIs over undocumented internals.

## Roadmap

### Phase 1 — Foundation

- VS Code extension scaffold
- Profile configuration
- Profile selection commands
- Active-profile state
- Status bar
- Architecture documentation

### Phase 2 — Profile switching

- Profile creation
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

Profiles are intended to rely on supported Codex isolation mechanisms such as separate `CODEX_HOME` directories. Authentication remains owned by Codex.

## Development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host after installing dependencies.

## Status

Early development.

## License

MIT
