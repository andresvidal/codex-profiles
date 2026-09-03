import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { prepareProfileCodexConfig } from '../src/profiles/sharedCodexConfig';

async function withTemporaryCodexHomes(
  fn: (root: string, defaultHome: string, workHome: string) => Promise<void>,
): Promise<void> {
  const previousCodexHome = process.env.CODEX_HOME;
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codex-profiles-config-'));
  const defaultHome = path.join(root, 'default');
  const workHome = path.join(root, 'work');
  process.env.CODEX_HOME = defaultHome;

  try {
    await fs.mkdir(defaultHome, { recursive: true });
    await fn(root, defaultHome, workHome);
  } finally {
    if (previousCodexHome === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = previousCodexHome;
    }
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('shared profile receives the Default Codex config without changing Default', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome) => {
    const source = path.join(defaultHome, 'config.toml');
    await fs.writeFile(source, 'model = "gpt-5"\n', 'utf8');

    await prepareProfileCodexConfig({
      id: 'work',
      name: 'Work',
      codexHome: workHome,
      configMode: 'shared',
    });

    assert.equal(await fs.readFile(path.join(workHome, 'config.toml'), 'utf8'), 'model = "gpt-5"\n');
    assert.equal(await fs.readFile(source, 'utf8'), 'model = "gpt-5"\n');
  });
});

test('isolated profile keeps its existing Codex config', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome, workHome) => {
    await fs.writeFile(path.join(defaultHome, 'config.toml'), 'model = "default"\n', 'utf8');
    await fs.mkdir(workHome, { recursive: true });
    await fs.writeFile(path.join(workHome, 'config.toml'), 'model = "work"\n', 'utf8');

    await prepareProfileCodexConfig({
      id: 'work',
      name: 'Work',
      codexHome: workHome,
      configMode: 'isolated',
    });

    assert.equal(await fs.readFile(path.join(workHome, 'config.toml'), 'utf8'), 'model = "work"\n');
  });
});

test('Default profile is never projected or rewritten', async () => {
  await withTemporaryCodexHomes(async (_root, defaultHome) => {
    const configPath = path.join(defaultHome, 'config.toml');
    await fs.writeFile(configPath, 'approval_policy = "on-request"\n', 'utf8');

    await prepareProfileCodexConfig({
      id: 'default',
      name: 'Default',
      codexHome: defaultHome,
    });

    assert.equal(await fs.readFile(configPath, 'utf8'), 'approval_policy = "on-request"\n');
  });
});

test('shared profile removes stale projected config when Default has no config', async () => {
  await withTemporaryCodexHomes(async (_root, _defaultHome, workHome) => {
    await fs.mkdir(workHome, { recursive: true });
    const destination = path.join(workHome, 'config.toml');
    await fs.writeFile(destination, 'stale = true\n', 'utf8');

    await prepareProfileCodexConfig({
      id: 'work',
      name: 'Work',
      codexHome: workHome,
      configMode: 'shared',
    });

    await assert.rejects(fs.access(destination), (error: NodeJS.ErrnoException) => error.code === 'ENOENT');
  });
});
