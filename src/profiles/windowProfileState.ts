import type { CodexProfile } from './profile';

const ACTIVE_PROFILE_KEY = 'codexProfiles.activeProfileId';
const PENDING_RESTORE_KEY = 'codexProfiles.pendingIdeRestore';

export interface MementoLike {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Thenable<void>;
}

export interface PendingIdeRestore {
  readonly version: 1;
  readonly profileId: string;
  readonly editorUris: readonly string[];
}

export class WindowProfileState {
  constructor(private readonly state: MementoLike) {}

  resolveActiveProfile(
    profiles: readonly CodexProfile[],
    fallback: CodexProfile,
  ): CodexProfile {
    const activeId = this.state.get<string>(ACTIVE_PROFILE_KEY);
    if (!activeId) {
      return fallback;
    }

    return profiles.find((profile) => profile.id.toLocaleLowerCase() === activeId.toLocaleLowerCase()) ?? fallback;
  }

  getActiveProfileId(): string | undefined {
    return this.state.get<string>(ACTIVE_PROFILE_KEY);
  }

  async setActiveProfile(profile: CodexProfile): Promise<void> {
    await this.state.update(ACTIVE_PROFILE_KEY, profile.id);
  }

  getPendingRestore(): PendingIdeRestore | undefined {
    const value = this.state.get<unknown>(PENDING_RESTORE_KEY);
    return isPendingIdeRestore(value) ? value : undefined;
  }

  async beginReload(profile: CodexProfile, editorUris: readonly string[]): Promise<void> {
    const pending: PendingIdeRestore = {
      version: 1,
      profileId: profile.id,
      editorUris: [...editorUris],
    };
    await this.state.update(ACTIVE_PROFILE_KEY, profile.id);
    await this.state.update(PENDING_RESTORE_KEY, pending);
  }

  async clearPendingRestore(): Promise<void> {
    await this.state.update(PENDING_RESTORE_KEY, undefined);
  }
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
