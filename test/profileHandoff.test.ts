import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { createProfileHandoffEnvironment, readProfileCatalog, readProfileHandoff } from '../src/workspace/profileHandoff';

const defaultHome = path.join(os.tmpdir(), 'default-codex');
const workHome = path.join(os.tmpdir(), 'work-codex');
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

test('profile handoff preserves the selected profile', () => {
  const environment = createProfileHandoffEnvironment(workProfile, [defaultProfile, workProfile]);
  const selected = readProfileHandoff(environment);

  assert.equal(selected?.id, 'work');
  assert.equal(selected?.name, 'Work');
  assert.equal(selected?.codexHome, workHome);
  assert.equal(environment.CODEX_HOME, workHome);
});

test('profile handoff preserves the available profile catalog', () => {
  const environment = createProfileHandoffEnvironment(workProfile, [defaultProfile, workProfile]);
  const profiles = readProfileCatalog(environment);

  assert.deepEqual(
    profiles.map((profile) => ({ id: profile.id, name: profile.name })),
    [
      { id: 'default', name: 'Default' },
      { id: 'work', name: 'Work' },
    ],
  );
});

test('invalid handoff data is ignored', () => {
  assert.equal(readProfileHandoff({ CODEX_PROFILES_ACTIVE_PROFILE: '{bad json' }), undefined);
  assert.deepEqual(readProfileCatalog({ CODEX_PROFILES_PROFILE_CATALOG: '{}' }), []);
});
