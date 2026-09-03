import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { Logger } from './logging/logger';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { getDefaultProfile } from './profiles/defaultProfile';
import { CodexTerminalLauncher } from './session/codexTerminalLauncher';
import { ProfileStatusBar } from './status/profileStatusBar';

export function activate(context: vscode.ExtensionContext): void {
  const logger = new Logger();
  const defaultProfile = getDefaultProfile();
  const activeProfileStore = new ActiveProfileStore(defaultProfile);
  const statusBar = new ProfileStatusBar(activeProfileStore);
  const launcher = new CodexTerminalLauncher(logger);

  context.subscriptions.push(logger, statusBar);
  logger.info(`Activated with Default profile at ${defaultProfile.codexHome}.`);
  registerCommands(context, activeProfileStore, statusBar, logger, launcher);
}

export function deactivate(): void {
  // Profile directories and Codex data are intentionally left untouched.
}
