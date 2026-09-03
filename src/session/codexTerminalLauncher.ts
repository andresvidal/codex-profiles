import * as vscode from 'vscode';
import type { Logger } from '../logging/logger';
import type { ConfigProjectionStateStore } from '../profiles/configProjectionState';
import type { CodexProfile } from '../profiles/profile';
import { prepareProfileCodexConfig } from '../profiles/sharedCodexConfig';
import { createCodexTerminalLaunchPlan } from './codexTerminalLaunchPlan';

export class CodexTerminalLauncher {
  constructor(
    private readonly logger: Logger,
    private readonly configProjectionState: ConfigProjectionStateStore,
  ) {}

  async launch(profile: CodexProfile): Promise<vscode.Terminal> {
    await prepareProfileCodexConfig(profile, this.configProjectionState, this.logger);

    const plan = createCodexTerminalLaunchPlan(profile);
    const cwd = vscode.workspace.workspaceFolders?.[0]?.uri;
    const terminal = vscode.window.createTerminal({
      name: plan.name,
      cwd,
      env: { ...plan.env },
      isTransient: false,
    });

    this.logger.info(`Launching Codex terminal for ${profile.name} with CODEX_HOME=${plan.env.CODEX_HOME}.`);
    terminal.show(true);
    terminal.sendText(plan.command, true);
    return terminal;
  }
}
