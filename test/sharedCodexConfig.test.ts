import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { ConfigProjectionStateStore } from '../src/profiles/configProjectionState';
import type { CodexProfile } from '../src/profiles/profile';
import { prepareProfileCodexConfig } from '../src/profiles/sharedCodexConfig';

async function withTemporaryCodexHomes(
  fn: (
    root: string,
    defaultHome: string,
    workHome: string,
    stateStore: ConfigProjectionStateStore,
  ) => Promise<void>,
): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-profiles-config-'));
  const defaultHome = path.join(root, 'default');
  const workHome = path.join(root, 'work');
  const stateStore = new ConfigProjectionStateStore(path.join(root, 'projection-state'));

  try {
    await fs.mkdir(defaultHome, { recursive: true });
    await fn(root, defaultHome, workHome, stateStore);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const workProfile = (workHome: string): CodexProfile => ({
  id: 'work',
  name: 'Work',
  codexHome: workHome,
  configMode: 'shared',
});

const defaultProfile = (defaultHome: string): CodexProfile => ({
  id: 'default',
  name: 'Default',
  codexHome: defaultHome,
});

async function prepare(
  profile: CodexProfile,
  defaultHome: string,
  stateStore: ConfigProjectionStateStore,
) {
  return prepareProfileCodexConfig(profile, stateStore, undefined, defaultProfile(defaultHome));
}

test('shared profile receives the Default Codex config without changing Default', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    const source = path.join(defaultHome, 'config.toml');
    await fs.writeFile(source, 'model = "gpt-5"\n', 'utf8');

    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'projected');
    assert.equal(await fs.readFile(path.join(workHome, 'config.toml'), 'utf8'), 'model = "gpt-5"\n');
    assert.equal(await fs.readFile(source, 'utf8'), 'model = "gpt-5"\n');
  });
});

test('managed shared config updates when Default changes and profile did not diverge', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    const source = path.join(defaultHome, 'config.toml');
    await fs.writeFile(source, 'model = "one"\n', 'utf8');
    await prepare(workProfile(workHome), defaultHome, stateStore);

    await fs.writeFile(source, 'model = "two"\n', 'utf8');
    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'projected');
    assert.equal(await fs.readFile(path.join(workHome, 'config.toml'), 'utf8'), 'model = "two"\n');
  });
});

test('shared profile preserves config that diverged from the last projection', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    const source = path.join(defaultHome, 'config.toml');
    await fs.writeFile(source, 'model = "default-one"\n', 'utf8');
    await prepare(workProfile(workHome), defaultHome, stateStore);

    const destination = path.join(workHome, 'config.toml');
    await fs.writeFile(destination, 'model = "custom-work"\n', 'utf8');
    await fs.writeFile(source, 'model = "default-two"\n', 'utf8');

    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'diverged');
    assert.equal(await fs.readFile(destination, 'utf8'), 'model = "custom-work"\n');
  });
});

test('untracked existing config is preserved rather than claimed as a projection', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    await fs.writeFile(path.join(defaultHome, 'config.toml'), 'model = "default"\n', 'utf8');
    await fs.mkdir(workHome, { recursive: true });
    const destination = path.join(workHome, 'config.toml');
    await fs.writeFile(destination, 'model = "existing"\n', 'utf8');

    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'diverged');
    assert.equal(await fs.readFile(destination, 'utf8'), 'model = "existing"\n');
  });
});

test('isolated profile keeps its existing Codex config', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    await fs.writeFile(path.join(defaultHome, 'config.toml'), 'model = "default"\n', 'utf8');
    await fs.mkdir(workHome, { recursive: true });
    await fs.writeFile(path.join(workHome, 'config.toml'), 'model = "work"\n', 'utf8');

    const result = await prepare(
      { id: 'work', name: 'Work', codexHome: workHome, configMode: 'isolated' },
      defaultHome,
      stateStore,
    );

    assert.equal(result, 'unchanged');
    assert.equal(await fs.readFile(path.join(workHome, 'config.toml'), 'utf8'), 'model = "work"\n');
  });
});

test('Default profile is never projected or rewritten', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, _workHome, stateStore) => {
    const configPath = path.join(defaultHome, 'config.toml');
    await fs.writeFile(configPath, 'approval_policy = "on-request"\n', 'utf8');

    const result = await prepare(defaultProfile(defaultHome), defaultHome, stateStore);

    assert.equal(result, 'unchanged');
    assert.equal(await fs.readFile(configPath, 'utf8'), 'approval_policy = "on-request"\n');
  });
});

test('managed shared config is removed when Default no longer has config', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    const source = path.join(defaultHome, 'config.toml');
    await fs.writeFile(source, 'managed = true\n', 'utf8');
    await prepare(workProfile(workHome), defaultHome, stateStore);
    await fs.unlink(source);

    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'removed');
    await assert.rejects(
      fs.access(path.join(workHome, 'config.toml')),
      (error: NodeJS.ErrnoException) => error.code === 'ENOENT',
    );
  });
});

test('untracked profile config is preserved when Default has no config', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome, stateStore) => {
    await fs.mkdir(workHome, { recursive: true });
    const destination = path.join(workHome, 'config.toml');
    await fs.writeFile(destination, 'user_owned = true\n', 'utf8');

    const result = await prepare(workProfile(workHome), defaultHome, stateStore);

    assert.equal(result, 'diverged');
    assert.equal(await fs.readFile(destination, 'utf8'), 'user_owned = true\n');
  });
});
