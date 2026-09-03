import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { createUniqueProfileId, pathsEqual, resolveProfilePath, suggestProfileHome } from '../src/profiles/profilePaths';

test('suggestProfileHome derives a stable slug from the profile name', () => {
  assert.equal(suggestProfileHome('Client A'), path.join(os.homedir(), '.codex-profiles', 'client-a'));
  assert.equal(suggestProfileHome('  My Personal Account  '), path.join(os.homedir(), '.codex-profiles', 'my-personal-account'));
});

test('resolveProfilePath expands the user home marker', () => {
  assert.equal(resolveProfilePath('~/.codex-profiles/work'), path.resolve(os.homedir(), '.codex-profiles', 'work'));
});

test('pathsEqual compares normalized paths', () => {
  const base = path.join(os.homedir(), '.codex-profiles', 'work');
  assert.equal(pathsEqual(base, path.join(base, '.')), true);
});

test('createUniqueProfileId handles collisions', () => {
  const profiles = [
    { id: 'work', name: 'Work', codexHome: '/tmp/work' },
    { id: 'work-2', name: 'Work 2', codexHome: '/tmp/work-2' },
  ];

  assert.equal(createUniqueProfileId('Work', profiles), 'work-3');
});
