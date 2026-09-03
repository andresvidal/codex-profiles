# ADR-005: Switch the Codex account, not the VS Code environment

## Status

Accepted.

## Context

Codex Profiles exists to let users work with multiple Codex accounts while preserving their normal development environment.

A per-profile VS Code `--user-data-dir` isolates more than Codex: it also separates editor settings, keybindings, UI state, extension state, and other user preferences. That is not an acceptable default experience.

Codex currently uses `CODEX_HOME` as the root for account state and user configuration. The current app-server command does not expose a supported production argument for selecting a different user config file independently of `CODEX_HOME`.

## Decision

The product invariant is:

> Switch my Codex account, not my development environment.

Codex Profiles therefore keeps the user's VS Code profile, settings, extensions, keybindings, themes, and workspace unchanged.

Each named Codex profile receives its own `CODEX_HOME` for account/session state. The built-in Default profile continues to use the user's pre-existing Codex home and is never migrated or rewritten by installation or uninstall.

### Codex configuration modes

Profiles have two Codex configuration modes:

- `shared` — the default for newly created profile homes. Before Codex is launched for the profile, Codex Profiles projects the Default profile's `config.toml` into the named profile home. Authentication and other account state remain in the named home.
- `isolated` — the profile keeps its own `config.toml`. Existing directories that the user explicitly reuses default to this mode so Codex Profiles does not overwrite existing configuration unexpectedly.

The projection copies configuration only. It never copies or interprets `auth.json`, tokens, credential stores, session databases, or other account data.

If the Default profile has no `config.toml`, a stale projected `config.toml` is removed from a `shared` named profile before launch so shared mode continues to reflect the Default configuration.

### IDE runtime boundary

The extension does not create alternate VS Code user-data directories.

True simultaneous per-window Codex IDE accounts require a supported way to bind the official Codex runtime/app-server in each VS Code window to a selected account home without changing the rest of VS Code. That binding remains an explicit runtime adapter boundary and must not be implemented by cloning the editor profile or by relying on undocumented token formats.

Until that binding exists, profile-specific `CODEX_HOME` isolation is fully supported for Codex CLI launches; IDE account switching remains incomplete.

## Consequences

- Installing Codex Profiles leaves the existing VS Code environment unchanged.
- Installing or uninstalling leaves the Default Codex profile unchanged.
- New named accounts start with familiar Codex configuration while keeping account state separate.
- Users can opt into completely independent Codex configuration per account.
- The same repository can continue to use its normal workspace and project-level configuration.
- `Open Workspace With Profile…` is removed until it can satisfy this invariant without creating a separate VS Code user profile.
