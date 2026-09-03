import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCodexProcessEnvironment, createCodexSessionEnvironment } from '../src/session/sessionEnvironment';
import type { CodexProfile } from '../src/profiles/profile';

const profile: CodexProfile = {
  id: 'work',
  name: 'Work',
  codexHome: '~/.codex-profiles/work',
};

test('session environment contains only the selected CODEX_HOME override', () => {
  const environment = createCodexSessionEnvironment(profile);

  assert.equal(Object.keys(environment).length, 1);
  assert.match(environment.CODEX_HOME, /\.codex-profiles[\\/]work$/);
});

test('process environment preserves the base environment and overrides CODEX_HOME without mutation', () => {
  const baseEnvironment: NodeJS.ProcessEnv = {
    PATH: '/example/bin',
    CODEX_HOME: '/old/home',
    CUSTOM_VALUE: 'preserved',
  };

  const environment = createCodexProcessEnvironment(profile, baseEnvironment);

  assert.equal(environment.PATH, '/example/bin');
  assert.equal(environment.CUSTOM_VALUE, 'preserved');
  assert.match(environment.CODEX_HOME ?? '', /\.codex-profiles[\\/]work$/);
  assert.equal(baseEnvironment.CODEX_HOME, '/old/home');
});
