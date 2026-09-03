# ADR-004: Isolate VS Code instances per Codex profile

## Status

Superseded by ADR-005.

## Context

This design used a unique VS Code `--user-data-dir` per Codex profile so each window could receive a different `CODEX_HOME` before extension activation.

## Decision

Do not use this design as the product architecture.

Although it can isolate process environments, `--user-data-dir` also creates a separate VS Code settings/state environment. That violates the product goal of switching only the Codex account while preserving the user's existing editor profile, settings, extensions, keybindings, themes, and other extension state.

The implementation and product settings associated with this ADR have been removed.

## Historical note

The design remains useful evidence for a VS Code limitation: `--new-window` alone is not a reliable way to give later VS Code windows different process environments when an existing VS Code instance is already running.

Future per-window Codex IDE isolation therefore needs a Codex-runtime-level binding rather than a whole-editor process-isolation workaround.
