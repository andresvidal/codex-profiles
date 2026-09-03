import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CodexProfile } from './profile';
import { resolveProfilePath } from './profilePaths';

interface ConfigProjectionState {
  readonly version: 1;
  readonly projectedSha256: string;
}

export class ConfigProjectionStateStore {
  constructor(private readonly root: string) {}

  async read(profile: CodexProfile): Promise<string | undefined> {
    try {
      const raw = await fs.readFile(this.getStatePath(profile), 'utf8');
      const value = JSON.parse(raw) as unknown;
      if (!isProjectionState(value)) {
        return undefined;
      }
      return value.projectedSha256;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) {
        return undefined;
      }
      throw error;
    }
  }

  async write(profile: CodexProfile, projectedSha256: string): Promise<void> {
    const statePath = this.getStatePath(profile);
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    const state: ConfigProjectionState = { version: 1, projectedSha256 };
    await writeAtomic(statePath, `${JSON.stringify(state)}\n`);
  }

  async delete(profile: CodexProfile): Promise<void> {
    try {
      await fs.unlink(this.getStatePath(profile));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private getStatePath(profile: CodexProfile): string {
    const identity = `${profile.id.trim()}\0${resolveProfilePath(profile.codexHome)}`;
    const key = createHash('sha256').update(identity).digest('hex');
    return path.join(this.root, `${key}.json`);
  }
}

export function sha256(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function isProjectionState(value: unknown): value is ConfigProjectionState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ConfigProjectionState>;
  return candidate.version === 1 && /^[a-f0-9]{64}$/.test(candidate.projectedSha256 ?? '');
}

async function writeAtomic(destination: string, content: string): Promise<void> {
  const temporary = `${destination}.tmp.${process.pid}.${Date.now()}`;
  try {
    await fs.writeFile(temporary, content, { encoding: 'utf8', mode: 0o600 });
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
