import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { getDefaultProfile } from './profiles/defaultProfile';
import { ProfileStatusBar } from './status/profileStatusBar';

export function activate(context: vscode.ExtensionContext): void {
  const activeProfileStore = new ActiveProfileStore(getDefaultProfile());
  const statusBar = new ProfileStatusBar(activeProfileStore);

  context.subscriptions.push(statusBar);
  registerCommands(context, activeProfileStore, statusBar);
}

export function deactivate(): void {
  // Profile directories and Codex data are intentionally never removed on deactivate/uninstall.
}
