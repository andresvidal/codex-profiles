import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Logger } from '../logging/logger';
import { getDefaultProfile } from './defaultProfile';
import { getProfileConfigMode, type CodexProfile } from './profile';

const CONFIG_FILE = 'config.toml';

export async function prepareProfileCodexConfig(
  profile: CodexProfile,
  logger?: Logger,
): Promise<void> {
  const defaultProfile = getDefaultProfile();
  if (profile.id === defaultProfile.id || getProfileConfigMode(profile) === 'isolated') {
    return;
  }

  const source = path.join(defaultProfile.codexHome, CONFIG_FILE);
  const destination = path.join(profile.codexHome, CONFIG_FILE);
  await fs.mkdir(profile.codexHome, { recursive: true });

  try {
    const sourceContent = await fs.readFile(source);
    const changed = await writeIfChanged(destination, sourceContent);
    if (changed) {
      logger?.info(`Projected shared Codex config into ${destination}.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await removeIfExists(destination);
      return;
    }
    throw error;
  }
}

async function writeIfChanged(destination: string, content: Buffer): Promise<boolean> {
  try {
    const existing = await fs.readFile(destination);
    if (existing.equals(content)) {
      return false;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

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
    return true;
  } catch (error) {
    try {
      await fs.unlink(temporary);
    } catch {
      // Best-effort cleanup only.
    }
    throw error;
  }
}

async function removeIfExists(file: string): Promise<void> {
  try {
    await fs.unlink(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
