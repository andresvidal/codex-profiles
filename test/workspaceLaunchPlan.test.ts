import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { ACTIVE_PROFILE_ENV, PROFILE_CATALOG_ENV } from '../src/workspace/profileHandoff';
import { createWorkspaceLaunchPlan } from '../src/workspace/workspaceLaunchPlan';

const defaultHome = path.join(os.tmpdir(), 'default-codex');
const workHome = path.join(os.tmpdir(), 'work-codex');
const workspaceTarget = path.join(os.tmpdir(), 'repo');
const vscodeUserDataRoot = path.join(os.tmpdir(), 'codex-profiles-vscode');
const vscodeExtensionsDir = path.join(os.tmpdir(), 'extensions');
const extensionDevelopmentPath = path.join(os.tmpdir(), 'codex-profiles-extension');

const defaultProfile = {
  id: 'default',
  name: 'Default',
  codexHome: defaultHome,
};
const workProfile = {
  id: 'work',
  name: 'Work',
  codexHome: workHome,
};

test('workspace launch plan isolates VS Code user data and Codex home', () => {
  const plan = createWorkspaceLaunchPlan({
    profile: workProfile,
    availableProfiles: [defaultProfile, workProfile],
    workspaceTarget,
    vscodeCliPath: 'code',
    vscodeUserDataRoot,
    vscodeExtensionsDir,
    appName: 'Visual Studio Code',
    baseEnvironment: {
      PATH: process.env.PATH,
      VSCODE_IPC_HOOK: 'desktop-pipe',
      VSCODE_IPC_HOOK_CLI: 'cli-pipe',
      VSCODE_CLIENT_COMMAND: 'client-command',
      VSCODE_CLIENT_COMMAND_CWD: os.tmpdir(),
      VSCODE_CLI_AUTHORITY: 'remote',
      ELECTRON_RUN_AS_NODE: '1',
    },
  });

  assert.equal(plan.command, 'code');
  assert.equal(plan.userDataDir, path.join(vscodeUserDataRoot, 'work'));
  assert.equal(plan.extensionsDir, vscodeExtensionsDir);
  assert.ok(plan.args.includes('--new-window'));
  assert.ok(plan.args.includes(`--user-data-dir=${plan.userDataDir}`));
  assert.ok(plan.args.includes(`--extensions-dir=${vscodeExtensionsDir}`));
  assert.equal(plan.args.at(-1), workspaceTarget);
  assert.equal(plan.environment.CODEX_HOME, workHome);
  assert.equal(plan.environment.VSCODE_IPC_HOOK, undefined);
  assert.equal(plan.environment.VSCODE_IPC_HOOK_CLI, undefined);
  assert.equal(plan.environment.VSCODE_CLIENT_COMMAND, undefined);
  assert.equal(plan.environment.VSCODE_CLIENT_COMMAND_CWD, undefined);
  assert.equal(plan.environment.VSCODE_CLI_AUTHORITY, undefined);
  assert.equal(plan.environment.ELECTRON_RUN_AS_NODE, undefined);
  assert.ok(plan.environment[ACTIVE_PROFILE_ENV]?.includes('Work'));
  assert.ok(plan.environment[PROFILE_CATALOG_ENV]?.includes('Default'));
});

test('workspace launch plan includes extension development path when supplied', () => {
  const plan = createWorkspaceLaunchPlan({
    profile: workProfile,
    availableProfiles: [workProfile],
    workspaceTarget,
    vscodeCliPath: 'code',
    vscodeUserDataRoot,
    vscodeExtensionsDir,
    appName: 'Visual Studio Code',
    extensionDevelopmentPath,
  });

  assert.ok(plan.args.includes(`--extensionDevelopmentPath=${extensionDevelopmentPath}`));
});
