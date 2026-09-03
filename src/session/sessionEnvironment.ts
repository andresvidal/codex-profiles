import type { CodexProfile } from '../profiles/profile';
import { resolveProfilePath } from '../profiles/profilePaths';

export interface CodexSessionEnvironment {
  readonly [key: string]: string;
  readonly CODEX_HOME: string;
}

export function createCodexSessionEnvironment(profile: CodexProfile): CodexSessionEnvironment {
  return {
    CODEX_HOME: resolveProfilePath(profile.codexHome),
  };
}

export function createCodexProcessEnvironment(
  profile: CodexProfile,
  baseEnvironment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment,
    ...createCodexSessionEnvironment(profile),
  };
}
