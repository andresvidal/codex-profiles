import * as os from 'node:os';
import * as path from 'node:path';
import type { CodexProfile } from './profile';
import { resolveProfilePath } from './profilePaths';

export const DEFAULT_PROFILE_ID = 'default';
export const DEFAULT_PROFILE_NAME = 'Default';

// Capture the inherited home before Codex Profiles ever mutates process.env for
// a selected named profile. Default is an installation/startup concept and must
// not drift when CODEX_HOME is rebound for the official Codex runtime.
const inheritedCodexHomeAtModuleLoad = process.env.CODEX_HOME;

export function getDefaultProfile(): CodexProfile {
  return resolveDefaultProfile(inheritedCodexHomeAtModuleLoad);
}

export function resolveDefaultProfile(inheritedCodexHome: string | undefined): CodexProfile {
  const normalized = inheritedCodexHome?.trim();
  const codexHome = normalized
    ? resolveProfilePath(normalized)
    : path.join(os.homedir(), '.codex');

  return {
    id: DEFAULT_PROFILE_ID,
    name: DEFAULT_PROFILE_NAME,
    codexHome,
  };
}
