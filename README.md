# Codex Profiles

Codex Profiles is a VS Code extension for working with multiple OpenAI Codex accounts without changing the rest of your development environment.

> Switch my Codex account, not my development environment.

## Principles

- Keep the user's existing VS Code profile, settings, extensions, themes, keybindings, and workspace unchanged.
- Preserve the user's existing Codex home as the built-in `Default` profile.
- Isolate named Codex accounts with separate `CODEX_HOME` directories.
- Share the Default Codex configuration with newly created accounts by default.
- Never copy or interpret authentication tokens between account homes.
- Never delete Codex profile data during extension uninstall.
- Prefer supported VS Code and Codex mechanisms over undocumented internals.

## Default profile

Codex Profiles always exposes an implicit `Default` profile.

- If `CODEX_HOME` is already set, `Default` uses that value.
- Otherwise `Default` resolves to `~/.codex`.
- Installing, disabling, or uninstalling Codex Profiles does not migrate, rewrite, or delete the Default home.

Installing the extension should therefore be seamless for an existing Codex user.

## Named account profiles

Use **Codex Profiles: Create Profile** to add another account such as `Work`.

A newly created profile receives its own account home, for example:

```text
Default  -> ~/.codex
Work     -> ~/.codex-profiles/work
```

Account/session state remains separate because Codex runs with the profile-specific `CODEX_HOME`.

### Shared Codex configuration

New profile homes use `shared` configuration mode by default. Before launching Codex for a shared profile, Codex Profiles projects the Default profile's `config.toml` into the named account home.

This means normal Codex preferences such as model, MCP, approval, sandbox, and other user-level configuration can remain consistent while account state stays isolated.

Codex Profiles does not copy `auth.json`, token values, credential stores, session databases, or other account data as part of this projection.

A profile can instead use `configMode: "isolated"` to maintain its own Codex configuration. Existing directories that are explicitly reused default to isolated configuration so existing contents are not unexpectedly overwritten.

Project-level Codex configuration in the repository remains shared naturally because both accounts work against the same workspace.

## Launch Codex CLI

Use **Codex Profiles: Launch Codex CLI** to start a Codex CLI session for the account selected in the current VS Code window.

Before launch, shared Codex configuration is synchronized from Default when applicable. The terminal then receives only the profile-specific `CODEX_HOME` override and runs the normal `codex` command.

Existing Codex terminals keep the environment they were created with, so CLI sessions for different accounts can run concurrently.

## Codex IDE extension status

The official Codex IDE extension is a separate runtime from the CLI. Codex Profiles does not create a separate VS Code user-data directory just to change Codex accounts.

The previous `Open Workspace With Profile…` implementation used per-profile VS Code user-data directories. That design has been removed because it also separated editor settings and extension state.

The remaining product goal is a narrow per-window binding between the selected Codex account home and the official Codex app-server/runtime while leaving the rest of VS Code untouched. Until a supported runtime hook is available or validated, true simultaneous per-window IDE accounts remain incomplete.

## Authentication boundary

Authentication remains owned by Codex inside each account home. Codex Profiles does not manufacture tokens or implement OAuth/token refresh itself.

The architecture intentionally keeps the door open to secure opaque credential-state handling if a future IDE integration requires it, but the current account-home flow does not copy authentication material between profiles.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Development

```bash
npm install
npm run ci
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host after installing dependencies.

CI runs type checking, unit tests, and compilation on Windows, macOS, and Linux.

## Status

Early development.

## License

MIT
