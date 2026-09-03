import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { getDefaultProfile } from '../src/profiles/defaultProfile';

test('default profile uses inherited CODEX_HOME when set', () => {
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = path.join(os.tmpdir(), 'codex-custom-home');

  try {
    const profile = getDefaultProfile();
    assert.equal(profile.id, 'default');
    assert.equal(profile.name, 'Default');
    assert.equal(profile.codexHome, path.resolve(process.env.CODEX_HOME));
  } finally {
    if (previous === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = previous;
    }
  }
});

test('default profile falls back to ~/.codex when CODEX_HOME is unset', () => {
  const previous = process.env.CODEX_HOME;
  delete process.env.CODEX_HOME;

  try {
    const profile = getDefaultProfile();
    assert.equal(profile.codexHome, path.join(os.homedir(), '.codex'));
  } finally {
    if (previous !== undefined) {
      process.env.CODEX_HOME = previous;
    }
  }
});
