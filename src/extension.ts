import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
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

  context.subscriptions.push(logger, statusBar);
  logger.info(`Activated with Default profile at ${defaultProfile.codexHome}.`);
  registerCommands(
    context,
    activeProfileStore,
    statusBar,
    logger,
    cliLauncher,
  );
}

export function deactivate(): void {
  // Codex profile directories, authentication data, and user configuration are intentionally left untouched.
}
