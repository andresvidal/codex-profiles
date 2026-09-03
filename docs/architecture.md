# Architecture

Codex Profiles treats each VS Code window as the isolation boundary for a Codex profile.

## Core principle

Profiles are isolated environments, not swapped credentials.

The extension must not read, copy, modify, or manufacture Codex authentication material. When supported by Codex, each profile uses its own `CODEX_HOME` directory and Codex remains responsible for authentication inside that directory.

## Phase 1 flow

```text
codexProfiles.profiles
        ↓
configuration loader
        ↓
window-local active profile store
        ↓
commands + status bar
```

The active profile is intentionally window-local and in-memory in Phase 1. Workspace-scoped persistence is avoided because the same workspace may be open in multiple windows with different profiles.

## Planned boundaries

- `configuration/`: reads extension settings and validates profile definitions.
- `profiles/`: domain model and profile state.
- `commands/`: VS Code commands and user interaction.
- `status/`: status bar presentation.
- `session/` (Phase 2): constructs profile-specific environments and launches supported Codex sessions.
- `workspace/` (Phase 3): opens the same workspace in another window with an explicit profile handoff.

## Authentication boundary

Codex Profiles may:

- select a profile;
- resolve a profile-specific `CODEX_HOME`;
- create an empty profile directory if needed;
- launch a supported Codex process/session with that environment.

Codex Profiles must not:

- inspect auth tokens;
- copy auth files between profiles;
- rename or swap auth files;
- depend on undocumented credential formats;
- patch Codex internals.

## Important trade-off

Phase 1 does not persist the active profile across VS Code restarts. This is deliberate: a persistence mechanism must preserve per-window identity when the same repository is open more than once. That handoff design belongs with Phase 3 rather than being approximated with shared workspace state.
