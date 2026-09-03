import * as vscode from 'vscode';
import { getAvailableProfiles } from '../configuration/configuration';
import type { Logger } from '../logging/logger';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import type { CodexTerminalLauncher } from '../session/codexTerminalLauncher';
import type { ProfileStatusBar } from '../status/profileStatusBar';
import { createProfile } from './createProfile';

export function registerCommands(
  context: vscode.ExtensionContext,
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
  logger: Logger,
  launcher: CodexTerminalLauncher,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('codexProfiles.selectProfile', async () => {
      const profiles = getAvailableProfiles();
      const selected = await vscode.window.showQuickPick(
        profiles.map((profile) => ({
          label: profile.name,
          description: profile.codexHome,
          profile,
        })),
        { placeHolder: 'Select a Codex profile for this VS Code window' },
      );

      if (!selected) {
        return;
      }

      store.set(selected.profile);
      statusBar.refresh();
      logger.info(`Selected profile ${selected.profile.name} at ${selected.profile.codexHome}.`);
    }),

    vscode.commands.registerCommand('codexProfiles.createProfile', async () => {
      try {
        await createProfile(store, statusBar, logger);
      } catch (error) {
        logger.error('Failed to create profile.', error);
        await vscode.window.showErrorMessage('Failed to create Codex profile. See the Codex Profiles output for details.');
      }
    }),

    vscode.commands.registerCommand('codexProfiles.launchCodex', () => {
      try {
        launcher.launch(store.get());
      } catch (error) {
        logger.error('Failed to launch Codex.', error);
        void vscode.window.showErrorMessage('Failed to launch Codex. See the Codex Profiles output for details.');
      }
    }),

    vscode.commands.registerCommand('codexProfiles.showActiveProfile', async () => {
      const profile = store.get();
      await vscode.window.showInformationMessage(
        `Active Codex profile: ${profile.name} (${profile.codexHome})`,
      );
    }),
  );
}
