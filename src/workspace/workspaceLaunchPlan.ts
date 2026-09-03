import * as os from 'node:os';
import * as path from 'node:path';
import type { CodexProfile } from '../profiles/profile';
import { resolveProfilePath } from '../profiles/profilePaths';
import { createProfileHandoffEnvironment } from './profileHandoff';

export interface WorkspaceLaunchPlanOptions {
  readonly profile: CodexProfile;
  readonly availableProfiles: readonly CodexProfile[];
  readonly workspaceTarget: string;
  readonly vscodeCliPath: string;
  readonly vscodeUserDataRoot: string;
  readonly vscodeExtensionsDir?: string;
  readonly appName: string;
  readonly baseEnvironment?: NodeJS.ProcessEnv;
  readonly extensionDevelopmentPath?: string;
}

export interface WorkspaceLaunchPlan {
  readonly command: string;
  readonly args: readonly string[];
  readonly environment: NodeJS.ProcessEnv;
  readonly userDataDir: string;
  readonly extensionsDir: string;
}

export function createWorkspaceLaunchPlan(options: WorkspaceLaunchPlanOptions): WorkspaceLaunchPlan {
  const userDataDir = path.join(
    resolveProfilePath(options.vscodeUserDataRoot),
    safePathSegment(options.profile.id),
  );
  const extensionsDir = resolveExtensionsDir(
    options.vscodeExtensionsDir,
    options.appName,
    options.baseEnvironment ?? process.env,
  );
  const environment = sanitizeVsCodeRoutingEnvironment({
    ...(options.baseEnvironment ?? process.env),
    ...createProfileHandoffEnvironment(options.profile, options.availableProfiles),
  });
  const args = [
    '--new-window',
    `--user-data-dir=${userDataDir}`,
    `--extensions-dir=${extensionsDir}`,
  ];

  if (options.extensionDevelopmentPath) {
    args.push(`--extensionDevelopmentPath=${options.extensionDevelopmentPath}`);
  }

  args.push(options.workspaceTarget);

  return {
    command: options.vscodeCliPath.trim() || 'code',
    args,
    environment,
    userDataDir,
    extensionsDir,
  };
}

export function resolveExtensionsDir(
  configuredValue: string | undefined,
  appName: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = configuredValue?.trim();
  if (configured) {
    return resolveProfilePath(configured);
  }

  const inherited = environment.VSCODE_EXTENSIONS?.trim();
  if (inherited) {
    return resolveProfilePath(inherited);
  }

  const directoryName = appName.toLocaleLowerCase().includes('insiders')
    ? '.vscode-insiders'
    : '.vscode';
  return path.join(os.homedir(), directoryName, 'extensions');
}

function sanitizeVsCodeRoutingEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const sanitized = { ...environment };
  delete sanitized.VSCODE_IPC_HOOK;
  delete sanitized.VSCODE_IPC_HOOK_CLI;
  delete sanitized.VSCODE_CLIENT_COMMAND;
  delete sanitized.VSCODE_CLIENT_COMMAND_CWD;
  delete sanitized.VSCODE_CLI_AUTHORITY;
  delete sanitized.ELECTRON_RUN_AS_NODE;
  return sanitized;
}

function safePathSegment(value: string): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'profile';
}
