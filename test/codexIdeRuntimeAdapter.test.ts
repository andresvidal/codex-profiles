import assert from 'node:assert/strict';
import test from 'node:test';
import { CodexIdeRuntimeAdapter, type CodexIdeExtensionState } from '../src/ide/codexIdeRuntimeAdapter';

const profile = (codexHome: string) => ({
  id: 'work',
  name: 'Work',
  codexHome,
  configMode: 'shared' as const,
});

function state(overrides: Partial<CodexIdeExtensionState> = {}): CodexIdeExtensionState {
  return {
    installed: true,
    active: false,
    version: '1.0.0',
    ...overrides,
  };
}

test('binds CODEX_HOME before the official extension activates', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: '/default' };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  const result = adapter.bindBeforeActivation(profile('/work'));

  assert.equal(result.kind, 'bound');
  assert.equal(environment.CODEX_HOME, '/work');
});

test('does not retarget an already-active official extension', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: '/default' };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state({ active: true }));

  const result = adapter.bindBeforeActivation(profile('/work'));

  assert.deepEqual(result, {
    kind: 'requires-reload',
    requestedCodexHome: '/work',
    currentCodexHome: '/default',
  });
  assert.equal(environment.CODEX_HOME, '/default');
});

test('recognizes an already-active extension bound to the requested home', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: '/work' };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state({ active: true }));

  const result = adapter.bindBeforeActivation(profile('/work'));

  assert.deepEqual(result, { kind: 'already-bound', codexHome: '/work' });
});

test('restores the inherited environment when the adapter changed it', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: '/default' };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  adapter.bindBeforeActivation(profile('/work'));
  adapter.restoreOriginalEnvironment();

  assert.equal(environment.CODEX_HOME, '/default');
});

test('restores an originally-unset CODEX_HOME by deleting the override', () => {
  const environment: NodeJS.ProcessEnv = {};
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  adapter.bindBeforeActivation(profile('/work'));
  adapter.restoreOriginalEnvironment();

  assert.equal(environment.CODEX_HOME, undefined);
});
