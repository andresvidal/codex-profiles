import * as vscode from 'vscode';
import { registerCommands } from './commands/registerCommands';
import { ActiveProfileStore } from './profiles/activeProfileStore';
import { ProfileStatusBar } from './status/profileStatusBar';

export function activate(context: vscode.ExtensionContext): void {
  const activeProfileStore = new ActiveProfileStore();
  const statusBar = new ProfileStatusBar(activeProfileStore);

  context.subscriptions.push(statusBar);
  registerCommands(context, activeProfileStore, statusBar);
}

export function deactivate(): void {
  // Nothing to dispose beyond context-managed subscriptions.
}
