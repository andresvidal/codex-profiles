import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Logger } from '../logging/logger';
import { ConfigProjectionStateStore, sha256 } from './configProjectionState';
import { getDefaultProfile } from './defaultProfile';
import { getProfileConfigMode, type CodexProfile } from './profile';

const CONFIG_FILE = 'config.toml';

export type SharedConfigPreparationResult = 'unchanged' | 'projected' | 'removed' | 'diverged';

export async function prepareProfileCodexConfig(
  profile: CodexProfile,
  stateStore: ConfigProjectionStateStore,
  logger?: Logger,
): Promise<SharedConfigPreparationResult> {
  const defaultProfile = getDefaultProfile();
  if (profile.id === defaultProfile.id || getProfileConfigMode(profile) === 'isolated') {
    return 'unchanged';
  }

  const source = path.join(defaultProfile.codexHome, CONFIG_FILE);
  const destination = path.join(profile.codexHome, CONFIG_FILE);
  await fs.mkdir(profile.codexHome, { recursive: true });

  const previousProjection = await stateStore.read(profile);
  const existing = await readIfExists(destination);

  if (existing && !previousProjection) {
    logger?.warn(
      `Shared Codex config for ${profile.name} already exists without projection metadata; preserving ${destination}.`,
    );
    return 'diverged';
  }

  if (existing && previousProjection && sha256(existing) !== previousProjection) {
    logger?.warn(
      `Shared Codex config for ${profile.name} diverged from the last projection; preserving ${destination}.`,
    );
    return 'diverged';
  }

  const sourceContent = await readIfExists(source);
  if (!sourceContent) {
    if (existing && previousProjection && sha256(existing) === previousProjection) {
      await fs.unlink(destination);
      await stateStore.delete(profile);
      logger?.info(`Removed managed shared Codex config from ${destination}.`);
      return 'removed';
    }

    return 'unchanged';
  }

  const sourceHash = sha256(sourceContent);
  if (existing?.equals(sourceContent)) {
    return 'unchanged';
  }

  await writeFileAtomic(destination, sourceContent);
  await stateStore.write(profile, sourceHash);
  logger?.info(`Projected shared Codex config into ${destination}.`);
  return 'projected';
}

async function readIfExists(file: string): Promise<Buffer | undefined> {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

async function writeFileAtomic(destination: string, content: Buffer): Promise<void> {
  const temporary = `${destination}.codex-profiles.tmp.${process.pid}.${Date.now()}`;
  try {
    await fs.writeFile(temporary, content, { mode: 0o600 });
    try {
      await fs.rename(temporary, destination);
    } catch (error) {
      if (process.platform !== 'win32') {
        throw error;
      }
      await fs.copyFile(temporary, destination);
      await fs.unlink(temporary);
    }
  } catch (error) {
    try {
      await fs.unlink(temporary);
    } catch {
      // Best-effort cleanup only.
    }
    throw error;
  }
}
