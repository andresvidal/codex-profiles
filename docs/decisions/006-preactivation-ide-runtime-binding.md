# ADR-006: Pre-activation Codex IDE runtime binding

## Status

Experimental, partially validated.

## Context

Codex Profiles needs to bind only the official Codex runtime in a VS Code window to the selected account home while preserving the user's normal VS Code profile, settings, extensions, keybindings, theme, and workspace.

The official Codex IDE extension (`openai.chatgpt`) starts a Codex app-server process when the extension activates. The child process inherits the extension-host environment, including `CODEX_HOME`.

Existing extensions such as Session Router for Codex independently use the same general seam: arrange the desired Codex environment before the official extension activates. That validates the direction, but their project-routing model does not satisfy Codex Profiles' stricter requirement that two windows may open the same repository with different accounts.

The official `chatgpt.cliExecutable` setting is not an appropriate production routing mechanism. OpenAI documents it as development-only, and changing the executable path would couple Codex Profiles to a debug-oriented extension setting rather than the normal bundled runtime.

## Decision

Codex Profiles now contains an experimental `CodexIdeRuntimeAdapter`.

When the official extension is not active, the adapter sets the current extension host's `CODEX_HOME` to the selected profile home. If `openai.chatgpt` activates afterward, its app-server child process can inherit that account home without changing VS Code user data or credentials.

Codex Profiles activates eagerly so it can prepare the environment before normal lazy activation of the official Codex extension.

The adapter never activates, patches, restarts, or modifies `openai.chatgpt`. It also never reads or writes Codex authentication data.

If the official Codex extension is already active with a different `CODEX_HOME`, Codex Profiles refuses to report a successful switch. The existing runtime remains active and the selected profile is not changed.

## Why switching an already-active runtime is not enabled yet

Changing `process.env.CODEX_HOME` after the official extension has started does not retarget the already-running app-server.

A window or extension-host reload could restart Codex, but a second problem remains: the selected profile must survive that restart in a way that is unique to the individual VS Code window.

Workspace-scoped state is insufficient because Codex Profiles explicitly targets this case:

```text
Window A -> same repository -> Personal
Window B -> same repository -> Work
```

A handoff keyed only by workspace would make those windows collide. Until a reliable per-window reload handoff is validated, Codex Profiles does not automatically reload on account switch.

## Consequences

- A profile can be selected for the IDE before the official Codex extension activates in that window.
- The official extension continues to launch its normal bundled Codex runtime.
- No alternate VS Code `--user-data-dir` is introduced.
- No `auth.json` swapping or credential snapshotting is introduced.
- Selecting a different profile after Codex is already active is blocked rather than producing misleading state.
- Same-repository, different-account windows remain the acceptance test for the reload-safe handoff.

## Next validation

1. Verify on macOS, Windows, and Linux that `openai.chatgpt` app-server inherits the pre-set `CODEX_HOME`.
2. Verify two normal VS Code windows can select different homes before Codex activation and authenticate independently.
3. Identify a reload-safe, per-window handoff mechanism that does not use workspace state or separate VS Code user data.
4. Only then enable account switching after the official runtime is already active.
