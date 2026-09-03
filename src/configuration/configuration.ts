import * as vscode from 'vscode';
import { getDefaultProfile, DEFAULT_PROFILE_ID } from '../profiles/defaultProfile';
import type { CodexProfile, CodexProfileConfigMode } from '../profiles/profile';
import { pathsEqual } from '../profiles/profilePaths';

const SECTION = 'codexProfiles';
const PROFILES_KEY = 'profiles';

export function getConfiguredProfiles(): readonly CodexProfile[] {
  const configuration = vscode.workspace.getConfiguration(SECTION);
  const profiles = configuration.get<readonly CodexProfile[]>(PROFILES_KEY, []);

  return profiles.filter(isCodexProfile);
}

export function getAvailableProfiles(): readonly CodexProfile[] {
  return deduplicateProfiles([getDefaultProfile(), ...getConfiguredProfiles()]);
}

export async function addConfiguredProfile(profile: CodexProfile): Promise<void> {
  const configuration = vscode.workspace.getConfiguration(SECTION);
  const inspection = configuration.inspect<readonly CodexProfile[]>(PROFILES_KEY);
  const globalProfiles = (inspection?.globalValue ?? []).filter(isCodexProfile);

  await configuration.update(PROFILES_KEY, [...globalProfiles, profile], vscode.ConfigurationTarget.Global);
}

export function isProfileNameInUse(name: string): boolean {
  const normalized = name.trim().toLocaleLowerCase();
  return getAvailableProfiles().some((profile) => profile.name.toLocaleLowerCase() === normalized);
}

export function isProfileHomeInUse(codexHome: string): boolean {
  return getAvailableProfiles().some((profile) => pathsEqual(profile.codexHome, codexHome));
}

function deduplicateProfiles(profiles: readonly CodexProfile[]): readonly CodexProfile[] {
  const result: CodexProfile[] = [];

  for (const profile of profiles) {
    if (profile.id.toLocaleLowerCase() === DEFAULT_PROFILE_ID && profile.name !== 'Default') {
      continue;
    }

    if (
      result.some(
        (existing) =>
          existing.id.toLocaleLowerCase() === profile.id.toLocaleLowerCase() ||
          pathsEqual(existing.codexHome, profile.codexHome),
      )
    ) {
      continue;
    }

    result.push(profile);
  }

  return result;
}

function isCodexProfile(value: unknown): value is CodexProfile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<CodexProfile>;
  const configMode = candidate.configMode as CodexProfileConfigMode | undefined;
  return (
    typeof candidate.id === 'string' && candidate.id.trim().length > 0 &&
    candidate.id.toLocaleLowerCase() !== DEFAULT_PROFILE_ID &&
    typeof candidate.name === 'string' && candidate.name.trim().length > 0 &&
    typeof candidate.codexHome === 'string' && candidate.codexHome.trim().length > 0 &&
    (configMode === undefined || configMode === 'shared' || configMode === 'isolated')
  );
}
