import assert from 'node:assert/strict';
import * as path from 'node:path';
import test from 'node:test';
import { CodexIdeRuntimeAdapter, type CodexIdeExtensionState } from '../src/ide/codexIdeRuntimeAdapter';

const defaultHome = path.resolve('default-home');
const workHome = path.resolve('work-home');

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
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: defaultHome };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  const result = adapter.bindBeforeActivation(profile(workHome));

  assert.equal(result.kind, 'bound');
  assert.equal(environment.CODEX_HOME, workHome);
});

test('does not retarget an already-active official extension', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: defaultHome };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state({ active: true }));

  const result = adapter.bindBeforeActivation(profile(workHome));

  assert.deepEqual(result, {
    kind: 'requires-reload',
    requestedCodexHome: workHome,
    currentCodexHome: defaultHome,
  });
  assert.equal(environment.CODEX_HOME, defaultHome);
});

test('recognizes an already-active extension bound to the requested home', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: workHome };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state({ active: true }));

  const result = adapter.bindBeforeActivation(profile(workHome));

  assert.deepEqual(result, { kind: 'already-bound', codexHome: workHome });
});

test('restores the inherited environment when the adapter changed it', () => {
  const environment: NodeJS.ProcessEnv = { CODEX_HOME: defaultHome };
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  adapter.bindBeforeActivation(profile(workHome));
  adapter.restoreOriginalEnvironment();

  assert.equal(environment.CODEX_HOME, defaultHome);
});

test('restores an originally-unset CODEX_HOME by deleting the override', () => {
  const environment: NodeJS.ProcessEnv = {};
  const adapter = new CodexIdeRuntimeAdapter(environment, () => state());

  adapter.bindBeforeActivation(profile(workHome));
  adapter.restoreOriginalEnvironment();

  assert.equal(environment.CODEX_HOME, undefined);
});
