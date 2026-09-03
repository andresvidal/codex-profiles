# Codex Profiles

Codex Profiles is a VS Code extension for working with multiple OpenAI Codex profiles cleanly.

The goal is to let the same repository be open in separate VS Code windows, with each window starting with a different Codex account/profile environment.

## Principles

- No token swapping or authentication hacks.
- Prefer isolated `CODEX_HOME` directories for profiles.
- Treat each VS Code window as an independent profile/session boundary.
- Keep authentication owned by Codex.
- Preserve the user's existing Codex home by default.
- Never delete Codex profile data during extension uninstall.
- Use supported VS Code and Codex mechanisms instead of undocumented internals.
- Use TypeScript, strict typing, small modules, tests, and documented trade-offs.

## Profiles

Codex Profiles always exposes an implicit `Default` profile.

- If `CODEX_HOME` is already set, `Default` uses that value.
- Otherwise `Default` resolves to the normal user Codex home at `~/.codex`.
- Installing, disabling, or uninstalling the extension does not move, rewrite, or delete that directory.

Use **Codex Profiles: Create Profile** to add another profile. The extension asks for a profile name, proposes an isolated home such as `~/.codex-profiles/work`, and lets you edit the path before creating it. Existing directories require explicit confirmation before use.

Custom profile directories are user data. They remain on disk if the extension is disabled or uninstalled.

## Launch Codex CLI

Use **Codex Profiles: Launch Codex CLI** to start a Codex CLI session for the profile currently selected in that VS Code window.

The extension creates a new terminal named after the profile, sets that terminal's `CODEX_HOME` to the profile home, and runs the normal `codex` command. Switching profiles affects only future CLI launches; existing terminals keep the environment they were created with.

This command isolates the Codex CLI only. It does not rebind an already-running Codex IDE extension process.

## Open Workspace With Profile

Use **Codex Profiles: Open Workspace With Profile…** to open the current local repository or saved workspace in another VS Code instance under a selected Codex profile.

The new instance is launched with:

- the selected profile's `CODEX_HOME` in the VS Code process environment before extensions activate;
- a stable per-profile VS Code user-data directory under `~/.codex-profiles/vscode-data/<profile-id>` by default;
- the normal VS Code extensions directory shared through the supported `--extensions-dir` option;
- the selected profile and current profile catalog handed to the new Codex Profiles extension process;
- VS Code IPC-routing environment variables removed so the launch cannot silently reuse the current instance.

VS Code documents `--user-data-dir` as the supported way to run instances with separate environments. A consequence is that VS Code settings, preferences, UI state, and extension state are isolated per Codex profile. Installed extension files are shared, but user settings are not automatically copied between profile instances.

The same repository working tree is opened directly; Codex Profiles does not duplicate or copy the repository. Two windows can therefore edit the same files concurrently.

### Workspace launch settings

- `codexProfiles.vscodeCliPath`: VS Code CLI executable. Defaults to `code`. On macOS, set an absolute path if the shell command has not been installed.
- `codexProfiles.vscodeUserDataRoot`: root for per-profile VS Code user data. Defaults to `~/.codex-profiles/vscode-data`.
- `codexProfiles.vscodeExtensionsDir`: optional shared extensions directory. Empty uses `VSCODE_EXTENSIONS` when set, otherwise the normal `~/.vscode/extensions` location (`~/.vscode-insiders/extensions` for Insiders).

Current workspace-launch limitations:

- local VS Code windows only; Remote SSH, WSL, and Dev Container windows are not yet supported;
- multi-root workspaces must be saved before they can be reopened with another profile;
- VS Code Portable Mode can override `--user-data-dir` and `--extensions-dir` and is not yet supported;
- real end-to-end validation with multiple simultaneously signed-in Codex IDE accounts is still required against the current Codex extension release.

## Authentication boundary

Codex Profiles does not copy, modify, inspect, manufacture, or swap authentication tokens or authentication files.

Profiles rely on supported Codex isolation through separate `CODEX_HOME` directories. Authentication remains owned by Codex. An unauthenticated profile should go through Codex's normal sign-in flow inside that profile home.

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
