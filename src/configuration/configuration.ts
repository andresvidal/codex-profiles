import * as vscode from 'vscode';
import type { CodexProfile } from '../profiles/profile';

const SECTION = 'codexProfiles';
const PROFILES_KEY = 'profiles';

export function getConfiguredProfiles(): readonly CodexProfile[] {
  const configuration = vscode.workspace.getConfiguration(SECTION);
  const profiles = configuration.get<readonly CodexProfile[]>(PROFILES_KEY, []);

  return profiles.filter(isCodexProfile);
}

function isCodexProfile(value: unknown): value is CodexProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<CodexProfile>;
  return (
    typeof candidate.id === 'string' && candidate.id.trim().length > 0 &&
    typeof candidate.name === 'string' && candidate.name.trim().length > 0 &&
    typeof candidate.codexHome === 'string' && candidate.codexHome.trim().length > 0
  );
}
