import * as vscode from 'vscode';
import { getAvailableProfiles } from '../configuration/configuration';
import type { CodexIdeReloadCoordinator } from '../ide/codexIdeReloadCoordinator';
import type { CodexIdeRuntimeAdapter } from '../ide/codexIdeRuntimeAdapter';
import type { Logger } from '../logging/logger';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import { getProfileConfigMode } from '../profiles/profile';
import type { WindowProfileState } from '../profiles/windowProfileState';
import type { CodexTerminalLauncher } from '../session/codexTerminalLauncher';
import type { ProfileStatusBar } from '../status/profileStatusBar';
import { createProfile } from './createProfile';

export function registerCommands(
  context: vscode.ExtensionContext,
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
  logger: Logger,
  cliLauncher: CodexTerminalLauncher,
  ideRuntime: CodexIdeRuntimeAdapter,
  reloadCoordinator: CodexIdeReloadCoordinator,
  windowProfileState: WindowProfileState,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('codexProfiles.selectProfile', async () => {
      const profiles = getAvailableProfiles();
      const selected = await vscode.window.showQuickPick(
        profiles.map((profile) => ({
          label: profile.name,
          description: profile.codexHome,
          detail: profile.id === 'default'
            ? 'Existing Codex account and configuration'
            : `${getProfileConfigMode(profile) === 'shared' ? 'Shared' : 'Isolated'} Codex configuration`,
          profile,
        })),
        { placeHolder: 'Select a Codex account for this VS Code window' },
      );

      if (!selected) {
        return;
      }

      const current = store.get();
      if (selected.profile.id.toLocaleLowerCase() === current.id.toLocaleLowerCase()) {
        return;
      }

      const bindResult = ideRuntime.bindBeforeActivation(selected.profile);
      if (bindResult.kind === 'requires-reload') {
        logger.info(
          `Switching this window from ${current.name} to ${selected.profile.name} through a controlled Codex IDE reload.`,
        );
        await reloadCoordinator.switchWithReload(selected.profile);
        return;
      }

      await windowProfileState.setActiveProfile(selected.profile);
      store.set(selected.profile);
      statusBar.refresh();
      logger.info(`Selected profile ${selected.profile.name} at ${selected.profile.codexHome}.`);
    }),

    vscode.commands.registerCommand('codexProfiles.createProfile', async () => {
      const previousProfile = store.get();
      try {
        await createProfile(store, statusBar, logger);
        const createdProfile = store.get();
        if (createdProfile.id === previousProfile.id) {
          return;
        }

        const bindResult = ideRuntime.bindBeforeActivation(createdProfile);
        if (bindResult.kind === 'requires-reload') {
          logger.info(
            `Created ${createdProfile.name}; switching this window to the new profile through a controlled Codex IDE reload.`,
          );
          await reloadCoordinator.switchWithReload(createdProfile);
          return;
        }

        await windowProfileState.setActiveProfile(createdProfile);
      } catch (error) {
        store.set(previousProfile);
        statusBar.refresh();
        logger.error('Failed to create profile.', error);
        await vscode.window.showErrorMessage(
          'Failed to create Codex profile. See the Codex Profiles output for details.',
        );
      }
    }),

    vscode.commands.registerCommand('codexProfiles.launchCodexCli', async () => {
      try {
        await cliLauncher.launch(store.get());
      } catch (error) {
        logger.error('Failed to launch Codex CLI.', error);
        await vscode.window.showErrorMessage(
          'Failed to launch Codex CLI. See the Codex Profiles output for details.',
        );
      }
    }),

    vscode.commands.registerCommand('codexProfiles.showActiveProfile', async () => {
      const profile = store.get();
      const configDescription = profile.id === 'default'
        ? 'existing Default Codex configuration'
        : `${getProfileConfigMode(profile)} Codex configuration`;
      await vscode.window.showInformationMessage(
        `Active Codex profile: ${profile.name} (${profile.codexHome}); ${configDescription}.`,
      );
    }),
  );
}
