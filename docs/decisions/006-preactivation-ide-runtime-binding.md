# ADR-006: Deterministic Codex IDE runtime binding

## Status

Implemented experimentally; live multi-window validation required.

## Context

Codex Profiles needs to bind only the official Codex runtime in a VS Code window to the selected account home while preserving the user's normal VS Code profile, settings, extensions, keybindings, theme, and physical workspace.

The official Codex IDE extension (`openai.chatgpt`) starts a Codex app-server process when the extension activates. That child process inherits the extension-host environment, including `CODEX_HOME`.

Simply activating Codex Profiles eagerly and setting `process.env.CODEX_HOME` is not sufficient as a production guarantee. VS Code does not provide a general ordering guarantee that an eager `*` extension will activate before another extension whose view or chat-session activation event has already been requested.

Observed official Codex activation events include its Codex chat session and Codex view. Existing Codex integrations also identify Codex conversation editor tabs by the `chatgpt.conversationEditor` view type with `openai-codex` URIs.

## Decision

Codex Profiles uses a controlled reload transaction when switching an already-active Codex IDE runtime.

### Startup binding

The Default Codex home is captured immutably from the extension host's inherited environment before Codex Profiles changes `process.env`.

For each VS Code workspace identity, Codex Profiles stores only the selected profile ID in VS Code `workspaceState`. No authentication data or Codex configuration contents are stored there.

At activation:

1. Resolve the selected profile for the current workspace identity.
2. Set `process.env.CODEX_HOME` to that profile home while `openai.chatgpt` is still inactive.
3. Only after that binding is established may Codex UI be restored/opened.

The official extension therefore continues to spawn its normal bundled `codex app-server`; Codex Profiles changes only the inherited `CODEX_HOME`.

### Switching after Codex is active

Changing `process.env.CODEX_HOME` after `openai.chatgpt` has started cannot retarget the already-running app-server. The switch transaction therefore performs these steps:

```text
Select Work
    ↓
persist Work for this workspace identity
    ↓
capture open Codex conversation URIs
    ↓
close Codex conversation editor tabs
    ↓
close the auxiliary bar so a Codex sidebar is not restored during startup
    ↓
reload this VS Code window
    ↓
Codex Profiles activates
    ↓
resolve Work from workspaceState
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

VS Code `workspaceState` is scoped to a workspace identity, not to a physical repository path. Two windows that must use different Codex profiles therefore need distinct VS Code workspace identities.

This does **not** require separate VS Code user data or VS Code profiles.

VS Code's built-in **Duplicate As Workspace in New Window** command (`workbench.action.duplicateWorkspaceInNewWindow`) creates a new untitled workspace containing the same physical folders and copies the workspace settings. VS Code source shows that the command creates a new untitled workspace and then opens it in a new window while retaining the normal user environment.

This gives the target topology:

```text
Window A workspace identity A
  physical repo: /src/project
  Codex profile: Default

Window B workspace identity B
  physical repo: /src/project
  Codex profile: Work

Shared:
  VS Code user profile
  extensions
  user settings
  physical repo files
  .vscode/settings.json
  repo/.codex/config.toml

Isolated:
  workspaceState profile selection
  CODEX_HOME
  Codex authentication/session state
```

A normal saved `.code-workspace` opened twice would still represent one workspace identity, so Codex Profiles should not pretend it provides independent per-window state in that case. The duplicate-workspace flow is the supported mechanism for simultaneous same-repository account windows unless VS Code exposes a stronger true window-local persistence API.

## Authentication boundary

The runtime binding never reads, writes, copies, snapshots, or swaps `auth.json` or tokens.

Each selected `CODEX_HOME` contains authentication managed entirely by Codex itself.

## Rejected approaches

- `--user-data-dir`: deterministic but changes the development environment, violating the product invariant.
- Global `auth.json` swapping: deterministic only for one global active account and cannot support simultaneous different accounts safely.
- `chatgpt.cliExecutable`: development/debug-oriented and not an appropriate production routing mechanism.
- Eager `*` activation alone: technically useful but has an activation-order race.
- Workspace-path-only routing: cannot distinguish two account windows pointed at the same physical repository.

## Consequences

- Switching an active IDE account intentionally reloads only the current window.
- Codex-specific editor/sidebar UI is temporarily closed to remove startup activation triggers and restored afterward.
- Default-home identity cannot drift when `process.env.CODEX_HOME` is rebound to a named profile.
- Same-repository simultaneous accounts require distinct VS Code workspace identities, which can be created without separate user-data directories.
- No credential management is introduced.

## Required validation before calling Phase 3 complete

1. Verify on macOS, Windows, and Linux that the official app-server inherits the selected home after the controlled reload.
2. Verify restored `openai-codex` conversation editors reopen successfully after switching.
3. Use **Duplicate As Workspace in New Window** to open the same physical repository twice.
4. Bind Window A to Default and Window B to Work.
5. Confirm both official Codex app-server processes remain authenticated to different account homes simultaneously.
6. Verify editing `.vscode/settings.json` and repository `.codex/config.toml` remains shared between both windows.
7. Document Remote SSH, WSL, and Dev Container behavior separately because extension-host placement changes where `CODEX_HOME` is evaluated.
