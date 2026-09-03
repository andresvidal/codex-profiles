import type { CodexProfile } from '../profiles/profile';
import { resolveProfilePath } from '../profiles/profilePaths';

export const ACTIVE_PROFILE_ENV = 'CODEX_PROFILES_ACTIVE_PROFILE';

export function createProfileHandoffEnvironment(profile: CodexProfile): NodeJS.ProcessEnv {
  return {
    CODEX_HOME: resolveProfilePath(profile.codexHome),
    [ACTIVE_PROFILE_ENV]: JSON.stringify({
      id: profile.id,
      name: profile.name,
      codexHome: resolveProfilePath(profile.codexHome),
    }),
  };
}

export function readProfileHandoff(environment: NodeJS.ProcessEnv = process.env): CodexProfile | undefined {
  const raw = environment[ACTIVE_PROFILE_ENV]?.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const candidate = JSON.parse(raw) as Partial<CodexProfile>;
    if (
      typeof candidate.id !== 'string' || candidate.id.trim().length === 0 ||
      typeof candidate.name !== 'string' || candidate.name.trim().length === 0 ||
      typeof candidate.codexHome !== 'string' || candidate.codexHome.trim().length === 0
    ) {
      return undefined;
    }

    return {
      id: candidate.id.trim(),
      name: candidate.name.trim(),
      codexHome: resolveProfilePath(candidate.codexHome),
    };
  } catch {
    return undefined;
  }
}
