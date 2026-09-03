# Codex Profiles

Codex Profiles is a VS Code extension for working with multiple OpenAI Codex accounts without changing the rest of your development environment.

> Switch my Codex account, not my development environment.

## Principles

- Keep the user's existing VS Code profile, settings, extensions, themes, keybindings, and workspace unchanged.
- Preserve the user's existing Codex home as the built-in `Default` profile.
- Isolate named Codex accounts with separate `CODEX_HOME` directories.
- Share the Default Codex configuration with newly created accounts by default.
- Never read, copy, write, snapshot, or interpret Codex authentication files or tokens.
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

Account/session state remains separate because Codex runs with the profile-specific `CODEX_HOME`. Authentication is created and maintained by Codex through its normal login and refresh flows inside that home.

### Shared Codex configuration

New profile homes use `shared` configuration mode by default. Before launching Codex for a shared profile, Codex Profiles projects the Default profile's `config.toml` into the named account home.

A useful mental model is **inherit Default until customized**. A new account starts with the same user-level Codex preferences as Default. While its projected `config.toml` remains unchanged, later Default changes can continue to flow into it. Once that account changes its own `config.toml`, the profile is considered diverged and Codex Profiles preserves the account-specific version rather than overwriting it.

This means normal Codex preferences such as model, MCP, approval, sandbox, and other user-level configuration can start consistent while still allowing an account to specialize later.

Projection ownership is conservative. Codex Profiles stores only a SHA-256 hash of the last configuration it projected in extension-owned global state. A profile `config.toml` is automatically updated or removed only while its current contents still match that recorded projection. If the profile configuration diverges, Codex Profiles preserves it and stops overwriting it.

Codex Profiles never includes `auth.json`, token values, credential stores, session databases, or other account data in configuration projection or projection metadata.

A profile can instead use `configMode: "isolated"` to maintain its own Codex configuration. Existing directories that are explicitly reused default to isolated configuration so existing contents are not unexpectedly overwritten.

Project-level Codex configuration in the repository remains shared naturally because both accounts work against the same workspace.

### How settings behave when switching accounts

Consider an existing Codex user who installs Codex Profiles and then creates a `Work` account.

Initially:

```text
Default
  account home: ~/.codex
  user Codex config: ~/.codex/config.toml

Work
  account home: ~/.codex-profiles/work
  user Codex config: projected from Default

Repository
  .codex/config.toml       shared by both accounts
  .vscode/settings.json   shared by both accounts
```

If `Work` changes only repository/workspace configuration, such as `.codex/config.toml` or `.vscode/settings.json`, the same physical repository file changes, so `Default` sees that change too.

If `Work` changes its user-level Codex configuration under `~/.codex-profiles/work/config.toml`, that profile diverges from Default. From then on, Codex Profiles preserves the Work-specific configuration instead of replacing it with later Default changes.

For example:

```text
1. Default starts with:
   model = A
   approval = on-request

2. Create Work:
   Work inherits the same values.

3. Work changes its user-level approval setting:
   Default -> approval = on-request
   Work    -> approval = never

4. Switch to Default and change another user-level setting:
   Default -> personality = concise
   Work    -> remains on its diverged configuration

5. Switch back to Work and customize again:
   Default and Work now intentionally have different user-level Codex preferences,
   while repository and VS Code workspace settings remain shared.
```

The resulting behavior is:

| Setting layer | Default vs Work |
| --- | --- |
| VS Code profile, extensions, theme, keybindings | Shared |
| `.vscode/settings.json` in the repository | Shared |
| `.codex/config.toml` in the repository | Shared |
| Codex account/authentication | Isolated per `CODEX_HOME` |
| `$CODEX_HOME/config.toml` | Inherited from Default until the named account customizes it, then preserved independently |

This is a core product distinction: account switching does not clone the editor environment, and account-specific Codex preferences do not require making the entire workspace profile-specific.

## Launch Codex CLI

Use **Codex Profiles: Launch Codex CLI** to start a Codex CLI session for the account selected in the current VS Code window.

Before launch, shared Codex configuration is synchronized from Default when it is still extension-managed. The terminal then receives only the profile-specific `CODEX_HOME` override and runs the normal `codex` command.

Existing Codex terminals keep the environment they were created with, so CLI sessions for different accounts can run concurrently.

## Codex IDE extension status

The official Codex IDE extension is a separate runtime from the CLI. Codex Profiles does not create a separate VS Code user-data directory just to change Codex accounts.

The previous `Open Workspace With Profile…` implementation used per-profile VS Code user-data directories. That design has been removed because it also separated editor settings and extension state.

The remaining product goal is a narrow per-window binding between the selected Codex account home and the official Codex app-server/runtime while leaving the rest of VS Code untouched. Until a supported runtime hook is available or validated, true simultaneous per-window IDE accounts remain incomplete.

## Authentication boundary

Authentication remains entirely owned by Codex inside each account home.

Codex Profiles does not read or write `auth.json`, does not store credential snapshots in VS Code SecretStorage, does not implement OAuth or token refresh, and does not swap credentials between profiles. A named profile is authenticated by running Codex normally with that profile's `CODEX_HOME` and completing Codex's own sign-in flow.

This is a deliberate v1 architectural boundary, not an implementation gap. Changing it requires an explicit architecture decision and corresponding security review.

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
