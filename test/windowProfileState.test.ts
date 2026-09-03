import assert from 'node:assert/strict';
import test from 'node:test';
import type { CodexProfile } from '../src/profiles/profile';
import { WindowProfileState, type MementoLike } from '../src/profiles/windowProfileState';

class MemoryMemento implements MementoLike {
  private readonly values = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined;
  }

  update(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      this.values.delete(key);
    } else {
      this.values.set(key, value);
    }
    return Promise.resolve();
  }
}

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

test('falls back to Default when the workspace window has no saved selection', () => {
  const state = new WindowProfileState(new MemoryMemento());
  assert.equal(state.resolveActiveProfile([defaultProfile, workProfile], defaultProfile), defaultProfile);
});

test('restores the selected profile for the same workspace window', async () => {
  const state = new WindowProfileState(new MemoryMemento());
  await state.setActiveProfile(workProfile);

  assert.equal(state.resolveActiveProfile([defaultProfile, workProfile], defaultProfile), workProfile);
});

test('falls back safely when a previously selected profile no longer exists', async () => {
  const state = new WindowProfileState(new MemoryMemento());
  await state.setActiveProfile(workProfile);

  assert.equal(state.resolveActiveProfile([defaultProfile], defaultProfile), defaultProfile);
});

test('reload handoff persists the target profile and Codex conversation URIs', async () => {
  const state = new WindowProfileState(new MemoryMemento());
  await state.beginReload(workProfile, [
    'openai-codex:/thread/one',
    'openai-codex:/thread/two',
  ]);

  assert.equal(state.getActiveProfileId(), 'work');
  assert.deepEqual(state.getPendingRestore(), {
    version: 1,
    profileId: 'work',
    editorUris: [
      'openai-codex:/thread/one',
      'openai-codex:/thread/two',
    ],
  });
});

test('pending restore is cleared after it is consumed', async () => {
  const state = new WindowProfileState(new MemoryMemento());
  await state.beginReload(workProfile, ['openai-codex:/thread/one']);
  await state.clearPendingRestore();

  assert.equal(state.getPendingRestore(), undefined);
  assert.equal(state.getActiveProfileId(), 'work');
});
