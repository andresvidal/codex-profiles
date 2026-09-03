# ADR-006: Deterministic Codex IDE runtime binding

## Status

Implemented experimentally; live multi-window validation required.

## Context

Codex Profiles needs to bind only the official Codex runtime in a VS Code window to the selected account home while preserving the user's normal VS Code profile, settings, extensions, keybindings, theme, and workspace.

The official Codex IDE extension (`openai.chatgpt`) starts a Codex app-server process when the extension activates. That child process inherits the extension-host environment, including `CODEX_HOME`.

Simply activating Codex Profiles eagerly and setting `process.env.CODEX_HOME` is not sufficient as a production guarantee. VS Code does not provide a general ordering guarantee that an eager `*` extension will activate before another extension whose view or chat-session activation event has already been requested.

Observed official Codex activation events include its Codex chat session and Codex view. Existing Codex integrations identify Codex conversation editor tabs by the `chatgpt.conversationEditor` view type with `openai-codex` URIs.

## Decision

Codex Profiles uses a controlled reload transaction when switching an already-active Codex IDE runtime.

### Native-window identity

The reload handoff must distinguish two VS Code windows even when both display the exact same workspace. Workspace paths and VS Code `workspaceState` are therefore not sufficient as the identity mechanism.

VS Code gives every native window its own log root. In current VS Code source, the window log path is derived from the native `windowId`:

```text
<logsHome>/window<N>/
```

and the extension-host log path is below that window root. `ExtensionContext.logUri` is created from that extension-host log location plus the extension ID.

`Reload Window` reloads the same renderer `webContents`, rather than opening another workspace or another user-data environment. For the controlled reload transaction, `context.logUri` therefore supplies a stable identity for that exact native window while remaining different between simultaneous windows.

Codex Profiles hashes the current `context.logUri` and uses that hash only as a key for a small extension-owned state file under `globalStorageUri/window-state`. The file can contain:

```text
active profile ID
pending target profile ID
Codex conversation URIs to restore after reload
```

It never contains credentials, tokens, Codex configuration contents, or authentication files.

This identity is intended for a controlled `Reload Window` transaction. It is not treated as permanent identity across a full VS Code application quit/restart because a new log session may create different log paths.

### Startup binding

The Default Codex home is captured immutably from the extension host's inherited environment before Codex Profiles changes `process.env`.

At activation:

1. Derive this native window's handoff key from `context.logUri`.
2. Resolve the profile persisted for this native window, falling back to Default.
3. Set `process.env.CODEX_HOME` to that profile home while `openai.chatgpt` is still inactive.
4. Only after that binding is established may Codex UI be restored/opened.

The official extension therefore continues to spawn its normal bundled `codex app-server`; Codex Profiles changes only the inherited `CODEX_HOME`.

### Switching after Codex is active

Changing `process.env.CODEX_HOME` after `openai.chatgpt` has started cannot retarget the already-running app-server. The switch transaction therefore performs these steps:

```text
Select Work
    ↓
persist Work for this native window
    ↓
capture open Codex conversation URIs
    ↓
close Codex conversation editor tabs
    ↓
close the auxiliary bar so a Codex sidebar is not restored during startup
    ↓
reload this VS Code window
    ↓
Codex Profiles activates in the same native window
    ↓
derive the same window handoff key
    ↓
resolve Work
    ↓
set CODEX_HOME=Work
    ↓
reopen Codex sidebar
    ↓
restore captured Codex conversations
    ↓
openai.chatgpt activates and app-server inherits Work
```

The crucial difference from eager-activation-only injection is that the known Codex UI surfaces that request official-extension activation are removed before reload. They are restored only after the target `CODEX_HOME` is set.

### Same repository in two account windows

Because the handoff is keyed to the native window rather than the workspace, the target topology does not require cloned user data or copied workspace settings:

```text
Window A
  same workspace/repository
  native window key A
  Codex profile: Default

Window B
  same workspace/repository
  native window key B
  Codex profile: Work

Shared:
  VS Code user profile
  extensions
  user settings
  workspace settings
  physical repo files
  .vscode/settings.json
  repo/.codex/config.toml

Isolated:
  native-window Codex profile selection
  CODEX_HOME
  Codex authentication/session state
```

This is intentionally stronger than creating a second untitled workspace. VS Code's **Duplicate As Workspace in New Window** command copies workspace-level settings into a new workspace. That could let the two development environments diverge later, so Codex Profiles does not use that mechanism as its account-isolation primitive.

## Authentication boundary

The runtime binding never reads, writes, copies, snapshots, or swaps `auth.json` or tokens.

Each selected `CODEX_HOME` contains authentication managed entirely by Codex itself.

## Rejected approaches

- `--user-data-dir`: deterministic but changes the development environment, violating the product invariant.
- Global `auth.json` swapping: deterministic only for one global active account and cannot support simultaneous different accounts safely.
- `chatgpt.cliExecutable`: development/debug-oriented and not an appropriate production routing mechanism.
- Eager `*` activation alone: technically useful but has an activation-order race.
- Workspace-path or `workspaceState` routing: cannot distinguish two account windows showing the same workspace.
- Duplicating the workspace to obtain a second state namespace: copies workspace settings and weakens the shared-development-environment invariant.

## Consequences

- Switching an active IDE account intentionally reloads only the current native window.
- Codex-specific editor/sidebar UI is temporarily closed to remove startup activation triggers and restored afterward.
- Default-home identity cannot drift when `process.env.CODEX_HOME` is rebound to a named profile.
- Two windows can carry different handoff state even when they show the exact same workspace.
- No alternate VS Code workspace or user-data environment is required for account isolation.
- No credential management is introduced.

## Required validation before calling Phase 3 complete

1. Verify on macOS, Windows, and Linux that the official app-server inherits the selected home after the controlled reload.
2. Verify `context.logUri` is unchanged across `Reload Window` in current stable VS Code builds on all supported platforms.
3. Verify restored `openai-codex` conversation editors reopen successfully after switching.
4. Open the same physical workspace/repository in two normal VS Code windows without changing VS Code user data or workspace settings.
5. Bind Window A to Default and Window B to Work.
6. Confirm both official Codex app-server processes remain authenticated to different account homes simultaneously.
7. Verify editing `.vscode/settings.json` and repository `.codex/config.toml` remains immediately shared between both windows.
8. Document Remote SSH, WSL, and Dev Container behavior separately because extension-host placement changes where `CODEX_HOME` and `context.logUri` are evaluated.
