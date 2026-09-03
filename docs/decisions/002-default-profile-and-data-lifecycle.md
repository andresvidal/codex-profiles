# ADR-002: Preserve the existing Codex home as the built-in Default profile

## Status

Accepted

## Context

Many users will install Codex Profiles after already using Codex. Their existing Codex configuration and authentication data normally live in the Codex home directory. Installing or uninstalling this extension must not disrupt that existing environment.

The extension also needs a predictable first-run profile and a safe lifecycle for additional profile directories.

## Decision

Codex Profiles exposes a built-in profile named `Default`.

Its home directory is resolved as follows:

1. If the extension host inherits a non-empty `CODEX_HOME`, use that directory.
2. Otherwise use the normal Codex home at `~/.codex` (resolved from the platform user home directory).

The built-in Default profile is implicit. It is not added to `codexProfiles.profiles`, and the extension never creates, migrates, copies, clears, deletes, or otherwise mutates that directory merely because the extension is installed, activated, disabled, or uninstalled.

Each VS Code window initially selects the Default profile. A user must explicitly select or create another profile before that window uses another Codex home.

Custom profiles use separate home directories, proposed under `~/.codex-profiles/<profile-name>`. Creating a custom profile may create its directory when it does not already exist. If the directory already exists, the extension must warn the user before adopting it and must not inspect or alter existing contents.

Profile directories are user data, not extension installation data. Disabling or uninstalling Codex Profiles must leave both the Default home and all custom profile directories untouched.

The extension must not allow two configured profiles to point at the same resolved home directory.

## Consequences

- Existing Codex users keep their current identity and configuration after installing the extension.
- Uninstalling the extension restores the pre-extension behavior naturally because the normal Codex home was never moved or modified by the extension lifecycle.
- Custom profile authentication survives extension reinstallations because the profile directories remain on disk.
- Users are responsible for deleting profile directories if they intentionally want to destroy the Codex data stored there.
- The extension can manage profile metadata without owning Codex authentication artifacts.
