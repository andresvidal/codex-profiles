import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { CodexProfile } from './profile';

interface WindowStateData {
  readonly version: 1;
  readonly activeProfileId?: string;
  readonly pendingRestore?: PendingIdeRestore;
}

export interface PendingIdeRestore {
  readonly version: 1;
  readonly profileId: string;
  readonly editorUris: readonly string[];
}

/**
 * Persists profile selection for one native VS Code window.
 *
 * ExtensionContext.logUri is rooted below VS Code's `window<N>/exthost`
 * directory. VS Code reloads the same renderer webContents for Reload Window,
 * so this identity is stable across that controlled reload while remaining
 * distinct for two windows that show the same workspace.
 */
export class WindowProfileState {
  private readonly statePath: string;

  constructor(root: string, windowLogUri: string) {
    const key = createHash('sha256').update(windowLogUri).digest('hex');
    this.statePath = path.join(root, `${key}.json`);
  }

  async resolveActiveProfile(
    profiles: readonly CodexProfile[],
    fallback: CodexProfile,
  ): Promise<CodexProfile> {
    const data = await this.read();
    const activeId = data?.activeProfileId ?? data?.pendingRestore?.profileId;
    if (!activeId) {
      return fallback;
    }

    return profiles.find((profile) => profile.id.toLocaleLowerCase() === activeId.toLocaleLowerCase()) ?? fallback;
  }

  async getActiveProfileId(): Promise<string | undefined> {
    const data = await this.read();
    return data?.activeProfileId;
  }

  async setActiveProfile(profile: CodexProfile): Promise<void> {
    const current = await this.read();
    await this.write({
      version: 1,
      activeProfileId: profile.id,
      pendingRestore: current?.pendingRestore,
    });
  }

  async getPendingRestore(): Promise<PendingIdeRestore | undefined> {
    return (await this.read())?.pendingRestore;
  }

  async beginReload(profile: CodexProfile, editorUris: readonly string[]): Promise<void> {
    await this.write({
      version: 1,
      activeProfileId: profile.id,
      pendingRestore: {
        version: 1,
        profileId: profile.id,
        editorUris: [...editorUris],
      },
    });
  }

  async clearPendingRestore(): Promise<void> {
    const current = await this.read();
    if (!current) {
      return;
    }

    await this.write({
      version: 1,
      activeProfileId: current.activeProfileId,
    });
  }

  private async read(): Promise<WindowStateData | undefined> {
    try {
      const raw = await fs.readFile(this.statePath, 'utf8');
      const value = JSON.parse(raw) as unknown;
      return isWindowStateData(value) ? value : undefined;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || error instanceof SyntaxError) {
        return undefined;
      }
      throw error;
    }
  }

  private async write(data: WindowStateData): Promise<void> {
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.tmp.${process.pid}.${Date.now()}`;
    const content = `${JSON.stringify(data)}\n`;

    try {
      await fs.writeFile(temporary, content, { encoding: 'utf8', mode: 0o600 });
      try {
        await fs.rename(temporary, this.statePath);
      } catch (error) {
        if (process.platform !== 'win32') {
          throw error;
        }
        await fs.copyFile(temporary, this.statePath);
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
}

function isWindowStateData(value: unknown): value is WindowStateData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WindowStateData>;
  return candidate.version === 1 &&
    (candidate.activeProfileId === undefined || typeof candidate.activeProfileId === 'string') &&
    (candidate.pendingRestore === undefined || isPendingIdeRestore(candidate.pendingRestore));
}

function isPendingIdeRestore(value: unknown): value is PendingIdeRestore {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<PendingIdeRestore>;
  return candidate.version === 1 &&
    typeof candidate.profileId === 'string' &&
    candidate.profileId.length > 0 &&
    Array.isArray(candidate.editorUris) &&
    candidate.editorUris.every((uri) => typeof uri === 'string' && uri.length > 0);
}
