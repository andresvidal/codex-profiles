import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { CodexIdeReloadCoordinator } from './ide/codexIdeReloadCoordinator';
import { CodexIdeRuntimeAdapter, OFFICIAL_CODEX_EXTENSION_ID } from './ide/codexIdeRuntimeAdapter';
import { Logger } from './logging/logger';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { ConfigProjectionStateStore } from './profiles/configProjectionState';
import { getAvailableProfiles } from './configuration/configuration';
import { getDefaultProfile } from './profiles/defaultProfile';
import { WindowProfileState } from './profiles/windowProfileState';
import { CodexTerminalLauncher } from './session/codexTerminalLauncher';
import { ProfileStatusBar } from './status/profileStatusBar';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const logger = new Logger();
  const defaultProfile = getDefaultProfile();
  const windowProfileState = new WindowProfileState(context.workspaceState);
  const activeProfile = windowProfileState.resolveActiveProfile(getAvailableProfiles(), defaultProfile);
  const activeProfileStore = new ActiveProfileStore(activeProfile);
  const statusBar = new ProfileStatusBar(activeProfileStore);
  const projectionState = new ConfigProjectionStateStore(
    vscode.Uri.joinPath(context.globalStorageUri, 'config-projections').fsPath,
  );
  const cliLauncher = new CodexTerminalLauncher(logger, projectionState);
  const ideRuntime = new CodexIdeRuntimeAdapter(
    process.env,
    () => {
      const extension = vscode.extensions.getExtension(OFFICIAL_CODEX_EXTENSION_ID);
      return {
        installed: extension !== undefined,
        active: extension?.isActive ?? false,
        version: typeof extension?.packageJSON?.version === 'string'
          ? extension.packageJSON.version
          : undefined,
      };
    },
    logger,
  );
  const reloadCoordinator = new CodexIdeReloadCoordinator(windowProfileState, logger);

  context.subscriptions.push(logger, statusBar);

  const bindResult = ideRuntime.bindBeforeActivation(activeProfile);
  if (bindResult.kind === 'requires-reload') {
    logger.warn(
      `Could not apply persisted profile ${activeProfile.name} because the official Codex extension activated before Codex Profiles.`,
    );
  }

  logger.info(`Activated with ${activeProfile.name} profile at ${activeProfile.codexHome}.`);
  registerCommands(
    context,
    activeProfileStore,
    statusBar,
    logger,
    cliLauncher,
    ideRuntime,
    reloadCoordinator,
    windowProfileState,
  );

  if (bindResult.kind !== 'requires-reload') {
    await reloadCoordinator.restoreAfterReload(activeProfile);
  }
}

export function deactivate(): void {
  // Codex profile directories, authentication data, and user configuration are intentionally left untouched.
}
