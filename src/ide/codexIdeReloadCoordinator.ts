import * as vscode from 'vscode';
import type { Logger } from '../logging/logger';
import type { CodexProfile } from '../profiles/profile';
import type { WindowProfileState } from '../profiles/windowProfileState';

const CODEX_CONVERSATION_VIEW_TYPE = 'chatgpt.conversationEditor';
const CODEX_URI_SCHEME = 'openai-codex';
const OPEN_CODEX_SIDEBAR_COMMAND = 'chatgpt.openSidebar';
const RELOAD_WINDOW_COMMAND = 'workbench.action.reloadWindow';

export class CodexIdeReloadCoordinator {
  constructor(
    private readonly windowState: WindowProfileState,
    private readonly logger: Logger,
  ) {}

  async switchWithReload(profile: CodexProfile): Promise<void> {
    const codexTabs = getCodexConversationTabs();
    const editorUris = codexTabs
      .map((tab) => getCodexConversationUri(tab))
      .filter((uri): uri is vscode.Uri => uri !== undefined)
      .map((uri) => uri.toString());

    await this.windowState.beginReload(profile, editorUris);

    if (codexTabs.length > 0) {
      await vscode.window.tabGroups.close(codexTabs, true);
    }

    // The official Codex extension is observed to activate from its chat session
    // or view. Closing both restored surfaces before reload removes those triggers
    // until Codex Profiles has restored the selected CODEX_HOME.
    await vscode.commands.executeCommand('workbench.action.closeAuxiliaryBar');

    this.logger.info(
      `Prepared deterministic IDE switch to ${profile.name}; closed ${codexTabs.length} Codex conversation tab(s) before window reload.`,
    );
    await vscode.commands.executeCommand(RELOAD_WINDOW_COMMAND);
  }

  async restoreAfterReload(activeProfile: CodexProfile): Promise<void> {
    const pending = this.windowState.getPendingRestore();
    if (!pending || pending.profileId.toLocaleLowerCase() !== activeProfile.id.toLocaleLowerCase()) {
      return;
    }

    // Clear first so a failed restore cannot create a reload/restore loop.
    await this.windowState.clearPendingRestore();

    try {
      await vscode.commands.executeCommand(OPEN_CODEX_SIDEBAR_COMMAND);
    } catch (error) {
      this.logger.warn(`Could not reopen the Codex sidebar after profile switch: ${String(error)}`);
    }

    for (const serializedUri of pending.editorUris) {
      try {
        await vscode.commands.executeCommand(
          'vscode.openWith',
          vscode.Uri.parse(serializedUri),
          CODEX_CONVERSATION_VIEW_TYPE,
        );
      } catch (error) {
        this.logger.warn(`Could not restore Codex conversation ${serializedUri}: ${String(error)}`);
      }
    }
  }
}

function getCodexConversationTabs(): readonly vscode.Tab[] {
  const result: vscode.Tab[] = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (getCodexConversationUri(tab)) {
        result.push(tab);
      }
    }
  }
  return result;
}

function getCodexConversationUri(tab: vscode.Tab): vscode.Uri | undefined {
  const input = tab.input;
  if (!(input instanceof vscode.TabInputCustom)) {
    return undefined;
  }
  if (input.viewType !== CODEX_CONVERSATION_VIEW_TYPE || input.uri.scheme !== CODEX_URI_SCHEME) {
    return undefined;
  }
  return input.uri;
}
