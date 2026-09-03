import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { Logger } from './logging/logger';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { getDefaultProfile } from './profiles/defaultProfile';
import { CodexTerminalLauncher } from './session/codexTerminalLauncher';
import { ProfileStatusBar } from './status/profileStatusBar';
import { readProfileHandoff } from './workspace/profileHandoff';
import { WorkspaceLauncher } from './workspace/workspaceLauncher';

export function activate(context: vscode.ExtensionContext): void {
  const logger = new Logger();
  const initialProfile = readProfileHandoff() ?? getDefaultProfile();
  const activeProfileStore = new ActiveProfileStore(initialProfile);
  const statusBar = new ProfileStatusBar(activeProfileStore);
  const cliLauncher = new CodexTerminalLauncher(logger);
  const workspaceLauncher = new WorkspaceLauncher(
    logger,
    context.extensionMode === vscode.ExtensionMode.Development
      ? context.extensionUri.fsPath
      : undefined,
  );

  context.subscriptions.push(logger, statusBar);
  logger.info(`Activated with profile ${initialProfile.name} at ${initialProfile.codexHome}.`);
  registerCommands(
    context,
    activeProfileStore,
    statusBar,
    logger,
    cliLauncher,
    workspaceLauncher,
  );
}

export function deactivate(): void {
  // Profile directories and Codex data are intentionally left untouched.
}
