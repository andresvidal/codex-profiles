import * as vscode from 'vscode';
import { getAvailableProfiles } from '../configuration/configuration';
import type { Logger } from '../logging/logger';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import type { CodexTerminalLauncher } from '../session/codexTerminalLauncher';
import type { ProfileStatusBar } from '../status/profileStatusBar';
import type { WorkspaceLauncher } from '../workspace/workspaceLauncher';
import { createProfile } from './createProfile';

export function registerCommands(
  context: vscode.ExtensionContext,
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
  logger: Logger,
  cliLauncher: CodexTerminalLauncher,
  workspaceLauncher: WorkspaceLauncher,
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
        await vscode.window.showErrorMessage(
          'Failed to create Codex profile. See the Codex Profiles output for details.',
        );
      }
    }),

    vscode.commands.registerCommand('codexProfiles.launchCodexCli', () => {
      try {
        cliLauncher.launch(store.get());
      } catch (error) {
        logger.error('Failed to launch Codex CLI.', error);
        void vscode.window.showErrorMessage(
          'Failed to launch Codex CLI. See the Codex Profiles output for details.',
        );
      }
    }),

    vscode.commands.registerCommand('codexProfiles.openWorkspaceWithProfile', async () => {
      const profiles = getAvailableProfiles();
      const activeProfile = store.get();
      const selected = await vscode.window.showQuickPick(
        profiles.map((profile) => ({
          label: profile.name,
          description: profile.codexHome,
          detail:
            profile.id === activeProfile.id
              ? 'Currently active in this window'
              : 'Open this workspace in an isolated VS Code window',
          profile,
        })),
        { placeHolder: 'Select a Codex profile for the new VS Code window' },
      );

      if (!selected) {
        return;
      }

      try {
        await workspaceLauncher.openWithProfile(selected.profile, profiles);
      } catch (error) {
        logger.error('Failed to open workspace with profile.', error);
        const detail = error instanceof Error ? ` ${error.message}` : '';
        await vscode.window.showErrorMessage(
          `Failed to open workspace with Codex profile.${detail} See the Codex Profiles output for details.`,
        );
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
