import * as vscode from 'vscode';
import { getConfiguredProfiles } from '../configuration/configuration';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import type { ProfileStatusBar } from '../status/profileStatusBar';

export function registerCommands(
  context: vscode.ExtensionContext,
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('codexProfiles.selectProfile', async () => {
      const profiles = getConfiguredProfiles();

      if (profiles.length === 0) {
        await vscode.window.showInformationMessage(
          'No Codex profiles are configured. Add entries to codexProfiles.profiles in VS Code settings.',
        );
        return;
      }

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

    vscode.commands.registerCommand('codexProfiles.showActiveProfile', async () => {
      const profile = store.get();
      const message = profile
        ? `Active Codex profile: ${profile.name} (${profile.codexHome})`
        : 'No Codex profile is active in this VS Code window.';

      await vscode.window.showInformationMessage(message);
    }),
  );
}
