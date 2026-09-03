import * as vscode from 'vscode';
import { getAvailableProfiles } from '../configuration/configuration';
import type { CodexIdeRuntimeAdapter } from '../ide/codexIdeRuntimeAdapter';
import type { Logger } from '../logging/logger';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import { getProfileConfigMode } from '../profiles/profile';
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

      const bindResult = ideRuntime.bindBeforeActivation(selected.profile);
      if (bindResult.kind === 'requires-reload') {
        logger.warn(
          `Profile ${selected.profile.name} was not selected because the official Codex runtime is already active in this window.`,
        );
        await vscode.window.showWarningMessage(
          `Codex is already running in this window with ${bindResult.currentCodexHome ?? 'the inherited Default home'}. ` +
          `Switching to “${selected.profile.name}” requires a reload-safe per-window handoff that is not enabled yet. ` +
          'The current Codex account was left unchanged.',
        );
        return;
      }

      store.set(selected.profile);
      statusBar.refresh();
      logger.info(`Selected profile ${selected.profile.name} at ${selected.profile.codexHome}.`);
    }),

    vscode.commands.registerCommand('codexProfiles.createProfile', async () => {
      try {
        await createProfile(store, statusBar, logger);
        const bindResult = ideRuntime.bindBeforeActivation(store.get());
        if (bindResult.kind === 'requires-reload') {
          await vscode.window.showInformationMessage(
            `Created “${store.get().name}”. Codex is already active in this window, so the IDE account remains unchanged until a reload-safe handoff is available. You can use Launch Codex CLI with the new profile now.`,
          );
        }
      } catch (error) {
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
