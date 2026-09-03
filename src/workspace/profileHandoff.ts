import type { CodexProfile } from '../profiles/profile';
import { resolveProfilePath } from '../profiles/profilePaths';

export const ACTIVE_PROFILE_ENV = 'CODEX_PROFILES_ACTIVE_PROFILE';
export const PROFILE_CATALOG_ENV = 'CODEX_PROFILES_PROFILE_CATALOG';

export function createProfileHandoffEnvironment(
  profile: CodexProfile,
  availableProfiles: readonly CodexProfile[] = [profile],
): NodeJS.ProcessEnv {
  return {
    CODEX_HOME: resolveProfilePath(profile.codexHome),
    [ACTIVE_PROFILE_ENV]: JSON.stringify(normalizeProfile(profile)),
    [PROFILE_CATALOG_ENV]: JSON.stringify(availableProfiles.map(normalizeProfile)),
  };
}

export function readProfileHandoff(environment: NodeJS.ProcessEnv = process.env): CodexProfile | undefined {
  return parseProfile(environment[ACTIVE_PROFILE_ENV]);
}

export function readProfileCatalog(environment: NodeJS.ProcessEnv = process.env): readonly CodexProfile[] {
  const raw = environment[PROFILE_CATALOG_ENV]?.trim();
  if (!raw) {
    return [];
  }

  try {
    const candidates = JSON.parse(raw) as unknown;
    if (!Array.isArray(candidates)) {
      return [];
    }

    return candidates
      .map((candidate) => parseProfileValue(candidate))
      .filter((profile): profile is CodexProfile => profile !== undefined);
  } catch {
    return [];
  }
}

function parseProfile(raw: string | undefined): CodexProfile | undefined {
  const value = raw?.trim();
  if (!value) {
    return undefined;
  }

  try {
    return parseProfileValue(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function parseProfileValue(value: unknown): CodexProfile | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate = value as Partial<CodexProfile>;
  if (
    typeof candidate.id !== 'string' || candidate.id.trim().length === 0 ||
    typeof candidate.name !== 'string' || candidate.name.trim().length === 0 ||
    typeof candidate.codexHome !== 'string' || candidate.codexHome.trim().length === 0
  ) {
    return undefined;
  }

  return normalizeProfile({
    id: candidate.id,
    name: candidate.name,
    codexHome: candidate.codexHome,
  });
}

function normalizeProfile(profile: CodexProfile): CodexProfile {
  return {
    id: profile.id.trim(),
    name: profile.name.trim(),
    codexHome: resolveProfilePath(profile.codexHome),
  };
}
