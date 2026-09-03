import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { getDefaultProfile, resolveDefaultProfile } from '../src/profiles/defaultProfile';

test('default profile resolver uses inherited CODEX_HOME when set', () => {
  const inherited = path.join(os.tmpdir(), 'codex-custom-home');
  const profile = resolveDefaultProfile(inherited);

  assert.equal(profile.id, 'default');
  assert.equal(profile.name, 'Default');
  assert.equal(profile.codexHome, path.resolve(inherited));
});

test('default profile resolver falls back to ~/.codex when CODEX_HOME is unset', () => {
  const profile = resolveDefaultProfile(undefined);
  assert.equal(profile.codexHome, path.join(os.homedir(), '.codex'));
});

test('Default profile does not drift when process CODEX_HOME changes later', () => {
  const before = getDefaultProfile();
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = path.join(os.tmpdir(), 'runtime-selected-profile');

  try {
    assert.deepEqual(getDefaultProfile(), before);
  } finally {
    if (previous === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = previous;
    }
  }
});
