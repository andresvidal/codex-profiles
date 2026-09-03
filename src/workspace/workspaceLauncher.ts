import { promises as fs } from 'node:fs';
import spawn from 'cross-spawn';
import * as vscode from 'vscode';
import type { Logger } from '../logging/logger';
import type { CodexProfile } from '../profiles/profile';
import { createWorkspaceLaunchPlan } from './workspaceLaunchPlan';

const CONFIGURATION_SECTION = 'codexProfiles';

export class WorkspaceLauncher {
  constructor(
    private readonly logger: Logger,
    private readonly extensionDevelopmentPath?: string,
  ) {}

  async openWithProfile(
    profile: CodexProfile,
    availableProfiles: readonly CodexProfile[],
  ): Promise<void> {
    const workspaceTarget = getWorkspaceTarget();
    const configuration = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
    const plan = createWorkspaceLaunchPlan({
      profile,
      availableProfiles,
      workspaceTarget,
      vscodeCliPath: configuration.get<string>('vscodeCliPath', 'code'),
      vscodeUserDataRoot: configuration.get<string>(
        'vscodeUserDataRoot',
        '~/.codex-profiles/vscode-data',
      ),
      vscodeExtensionsDir: configuration.get<string>('vscodeExtensionsDir', ''),
      appName: vscode.env.appName,
      baseEnvironment: process.env,
      extensionDevelopmentPath: this.extensionDevelopmentPath,
    });

    await fs.mkdir(plan.userDataDir, { recursive: true });

    this.logger.info(
      `Opening workspace with profile ${profile.name}; CODEX_HOME=${profile.codexHome}; user-data-dir=${plan.userDataDir}.`,
    );

    await spawnDetached(plan.command, plan.args, plan.environment);
  }
}

function getWorkspaceTarget(): string {
  if (vscode.env.remoteName) {
    throw new Error(
      `Open Workspace With Profile is not yet supported from remote VS Code windows (${vscode.env.remoteName}).`,
    );
  }

  const workspaceFile = vscode.workspace.workspaceFile;
  if (workspaceFile?.scheme === 'file') {
    return workspaceFile.fsPath;
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 1 && folders[0]?.uri.scheme === 'file') {
    return folders[0].uri.fsPath;
  }

  if (folders.length > 1) {
    throw new Error('Save the multi-root workspace before opening it with another profile.');
  }

  throw new Error('Open a local folder or saved workspace before using this command.');
}

async function spawnDetached(
  command: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], {
      detached: true,
      env: environment,
      stdio: 'ignore',
    });

    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}
