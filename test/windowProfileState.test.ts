import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import type { CodexProfile } from '../src/profiles/profile';
import { WindowProfileState } from '../src/profiles/windowProfileState';

const defaultProfile: CodexProfile = {
  id: 'default',
  name: 'Default',
  codexHome: '/default',
};

const workProfile: CodexProfile = {
  id: 'work',
  name: 'Work',
  codexHome: '/work',
  configMode: 'shared',
};

async function withTemporaryState(
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-profiles-window-state-'));
  try {
    await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

function state(root: string, window = 1): WindowProfileState {
  return new WindowProfileState(
    root,
    `file:///logs/20260903T190000/window${window}/exthost/andresvidal.codex-profiles`,
  );
}

test('falls back to Default when the native window has no saved selection', async () => {
  await withTemporaryState(async (root) => {
    assert.equal(
      await state(root).resolveActiveProfile([defaultProfile, workProfile], defaultProfile),
      defaultProfile,
    );
  });
});

test('restores the selected profile for the same native window', async () => {
  await withTemporaryState(async (root) => {
    await state(root).setActiveProfile(workProfile);

    const reloadedWindow = state(root);
    assert.equal(
      await reloadedWindow.resolveActiveProfile([defaultProfile, workProfile], defaultProfile),
      workProfile,
    );
  });
});

test('two native windows showing the same workspace keep independent profiles', async () => {
  await withTemporaryState(async (root) => {
    const windowOne = state(root, 1);
    const windowTwo = state(root, 2);

    await windowOne.setActiveProfile(defaultProfile);
    await windowTwo.setActiveProfile(workProfile);

    assert.equal(
      await state(root, 1).resolveActiveProfile([defaultProfile, workProfile], workProfile),
      defaultProfile,
    );
    assert.equal(
      await state(root, 2).resolveActiveProfile([defaultProfile, workProfile], defaultProfile),
      workProfile,
    );
  });
});

test('falls back safely when a previously selected profile no longer exists', async () => {
  await withTemporaryState(async (root) => {
    const windowState = state(root);
    await windowState.setActiveProfile(workProfile);

    assert.equal(await windowState.resolveActiveProfile([defaultProfile], defaultProfile), defaultProfile);
  });
});

test('reload handoff survives reconstruction for the exact native window', async () => {
  await withTemporaryState(async (root) => {
    await state(root).beginReload(workProfile, [
      'openai-codex:/thread/one',
      'openai-codex:/thread/two',
    ]);

    const reloadedWindow = state(root);
    assert.equal(await reloadedWindow.getActiveProfileId(), 'work');
    assert.deepEqual(await reloadedWindow.getPendingRestore(), {
      version: 1,
      profileId: 'work',
      editorUris: [
        'openai-codex:/thread/one',
        'openai-codex:/thread/two',
      ],
    });
  });
});

test('pending restore is cleared without losing the active profile', async () => {
  await withTemporaryState(async (root) => {
    const windowState = state(root);
    await windowState.beginReload(workProfile, ['openai-codex:/thread/one']);
    await windowState.clearPendingRestore();

    assert.equal(await windowState.getPendingRestore(), undefined);
    assert.equal(await windowState.getActiveProfileId(), 'work');
  });
});
