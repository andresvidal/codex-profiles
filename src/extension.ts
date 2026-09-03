import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { CodexIdeRuntimeAdapter, OFFICIAL_CODEX_EXTENSION_ID } from './ide/codexIdeRuntimeAdapter';
import { Logger } from './logging/logger';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { ConfigProjectionStateStore } from './profiles/configProjectionState';
import { getDefaultProfile } from './profiles/defaultProfile';
import { CodexTerminalLauncher } from './session/codexTerminalLauncher';
import { ProfileStatusBar } from './status/profileStatusBar';

export function activate(context: vscode.ExtensionContext): void {
  const logger = new Logger();
  const defaultProfile = getDefaultProfile();
  const activeProfileStore = new ActiveProfileStore(defaultProfile);
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

  context.subscriptions.push(logger, statusBar);
  ideRuntime.bindBeforeActivation(defaultProfile);
  logger.info(`Activated with Default profile at ${defaultProfile.codexHome}.`);
  registerCommands(
    context,
    activeProfileStore,
    statusBar,
    logger,
    cliLauncher,
    ideRuntime,
  );
}

export function deactivate(): void {
  // Codex profile directories, authentication data, and user configuration are intentionally left untouched.
}
