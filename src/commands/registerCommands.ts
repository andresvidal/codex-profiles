import * as vscode from 'vscode';
import { getAvailableProfiles } from '../configuration/configuration';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import type { ProfileStatusBar } from '../status/profileStatusBar';
import { createProfile } from './createProfile';

export function registerCommands(
  context: vscode.ExtensionContext,
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
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
    }),

    vscode.commands.registerCommand('codexProfiles.createProfile', async () => {
      await createProfile(store, statusBar);
    }),

    vscode.commands.registerCommand('codexProfiles.showActiveProfile', async () => {
      const profile = store.get();
      await vscode.window.showInformationMessage(
        `Active Codex profile: ${profile.name} (${profile.codexHome})`,
      );
    }),
  );
}
