import * as vscode from 'vscode';
import type { Logger } from '../logging/logger';
import type { CodexProfile } from '../profiles/profile';
import { createCodexSessionEnvironment } from './sessionEnvironment';

export class CodexTerminalLauncher {
  constructor(private readonly logger: Logger) {}

  launch(profile: CodexProfile): vscode.Terminal {
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
