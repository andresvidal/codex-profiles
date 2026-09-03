import * as vscode from 'vscode';
import { getDefaultProfile } from '../profiles/defaultProfile';
import type { CodexProfile } from '../profiles/profile';
import { pathsEqual } from '../profiles/profilePaths';

const SECTION = 'codexProfiles';
const PROFILES_KEY = 'profiles';

export function getConfiguredProfiles(): readonly CodexProfile[] {
  const configuration = vscode.workspace.getConfiguration(SECTION);
  const profiles = configuration.get<readonly CodexProfile[]>(PROFILES_KEY, []);

  return profiles.filter(isCodexProfile);
}

export function getAvailableProfiles(): readonly CodexProfile[] {
  return [getDefaultProfile(), ...getConfiguredProfiles()];
}

export async function addConfiguredProfile(profile: CodexProfile): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(SECTION);
  const profiles = getConfiguredProfiles();

  await configuration.update(PROFILES_KEY, [...profiles, profile], vscode.ConfigurationTarget.Global);
}

export function isProfileNameInUse(name: string): boolean {
  const normalized = name.trim().toLocaleLowerCase();
  return getAvailableProfiles().some((profile) => profile.name.toLocaleLowerCase() === normalized);
}

export function isProfileHomeInUse(codexHome: string): boolean {
  return getAvailableProfiles().some((profile) => pathsEqual(profile.codexHome, codexHome));
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
