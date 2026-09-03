import * as vscode from 'vscode';
import type { Logger } from '../logging/logger';
import type { CodexProfile } from '../profiles/profile';
import type { ConfigProjectionStateStore } from '../profiles/configProjectionState';
import { prepareProfileCodexConfig } from '../profiles/sharedCodexConfig';
import { createCodexSessionEnvironment } from './sessionEnvironment';

export class CodexTerminalLauncher {
  constructor(
    private readonly logger: Logger,
    private readonly configProjectionState: ConfigProjectionStateStore,
  ) {}

  async launch(profile: CodexProfile): Promise<vscode.Terminal> {
    await prepareProfileCodexConfig(profile, this.configProjectionState, this.logger);

    const environment = createCodexSessionEnvironment(profile);
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri;
    const terminal = vscode.window.createTerminal({
      name: `Codex (${profile.name})`,
      cwd,
      env: environment,
      isTransient: false,
    });

    this.logger.info(`Launching Codex terminal for ${profile.name} with CODEX_HOME=${environment.CODEX_HOME}.`);
    terminal.show(true);
    terminal.sendText('codex', true);
    return terminal;
  }
}
