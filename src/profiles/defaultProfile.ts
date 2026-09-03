import * as os from 'node:os';
import * as path from 'node:path';
import type { CodexProfile } from './profile';
import { resolveProfilePath } from './profilePaths';

export const DEFAULT_PROFILE_ID = 'default';
export const DEFAULT_PROFILE_NAME = 'Default';

export function getDefaultProfile(): CodexProfile {
  const inheritedCodexHome = process.env.CODEX_HOME?.trim();
  const codexHome = inheritedCodexHome
    ? resolveProfilePath(inheritedCodexHome)
    : path.join(os.homedir(), '.codex');

  return {
    id: DEFAULT_PROFILE_ID,
    name: DEFAULT_PROFILE_NAME,
    codexHome,
  };
}
