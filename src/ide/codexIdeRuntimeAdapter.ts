import type { Logger } from '../logging/logger';
import type { CodexProfile } from '../profiles/profile';
import { resolveProfilePath } from '../profiles/profilePaths';

export const OFFICIAL_CODEX_EXTENSION_ID = 'openai.chatgpt';

export interface CodexIdeExtensionState {
  readonly installed: boolean;
  readonly active: boolean;
  readonly version?: string;
}

export type CodexIdeBindResult =
  | { readonly kind: 'bound'; readonly codexHome: string }
  | { readonly kind: 'already-bound'; readonly codexHome: string }
  | {
      readonly kind: 'requires-reload';
      readonly requestedCodexHome: string;
      readonly currentCodexHome: string | undefined;
    };

/**
 * Binds the official Codex extension indirectly by setting CODEX_HOME in the
 * shared extension-host process before openai.chatgpt activates and spawns its
 * app-server child process.
 *
 * This class deliberately does not activate, restart, patch, or modify the
 * official extension. Once openai.chatgpt is active, changing process.env would
 * not retarget its already-running app-server, so a different home is reported
 * as requiring a window reload instead.
 */
export class CodexIdeRuntimeAdapter {
  private readonly originalCodexHome: string | undefined;
  private wroteCodexHome = false;

  constructor(
    private readonly environment: NodeJS.ProcessEnv,
    private readonly getExtensionState: () => CodexIdeExtensionState,
    private readonly logger?: Logger,
  ) {
    this.originalCodexHome = environment.CODEX_HOME;
  }

  bindBeforeActivation(profile: CodexProfile): CodexIdeBindResult {
    const requestedCodexHome = resolveProfilePath(profile.codexHome);
    const state = this.getExtensionState();
    const currentCodexHome = this.environment.CODEX_HOME
      ? resolveProfilePath(this.environment.CODEX_HOME)
      : undefined;

    if (state.active) {
      if (currentCodexHome === requestedCodexHome) {
        this.logger?.info(
          `Official Codex extension ${formatVersion(state)} is already active with CODEX_HOME=${requestedCodexHome}.`,
        );
        return { kind: 'already-bound', codexHome: requestedCodexHome };
      }

      this.logger?.warn(
        `Official Codex extension ${formatVersion(state)} is already active; cannot retarget its running app-server from ${currentCodexHome ?? '<unset>'} to ${requestedCodexHome} without a window reload.`,
      );
      return {
        kind: 'requires-reload',
        requestedCodexHome,
        currentCodexHome,
      };
    }

    if (currentCodexHome !== requestedCodexHome) {
      this.environment.CODEX_HOME = requestedCodexHome;
      this.wroteCodexHome = true;
    }

    this.logger?.info(
      `Prepared Codex IDE runtime binding for ${profile.name}: CODEX_HOME=${requestedCodexHome}; official extension ${state.installed ? `installed${state.version ? ` (${state.version})` : ''}` : 'not installed'} and not active.`,
    );
    return { kind: 'bound', codexHome: requestedCodexHome };
  }

  restoreOriginalEnvironment(): void {
    if (!this.wroteCodexHome) {
      return;
    }

    if (this.originalCodexHome === undefined) {
      delete this.environment.CODEX_HOME;
    } else {
      this.environment.CODEX_HOME = this.originalCodexHome;
    }
    this.wroteCodexHome = false;
  }
}

function formatVersion(state: CodexIdeExtensionState): string {
  return state.version ? `${OFFICIAL_CODEX_EXTENSION_ID}@${state.version}` : OFFICIAL_CODEX_EXTENSION_ID;
}
