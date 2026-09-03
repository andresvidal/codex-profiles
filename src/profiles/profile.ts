export type CodexProfileConfigMode = 'shared' | 'isolated';

export interface CodexProfile {
  readonly id: string;
  readonly name: string;
  readonly codexHome: string;
  readonly configMode?: CodexProfileConfigMode;
}

export function getProfileConfigMode(profile: CodexProfile): CodexProfileConfigMode {
  return profile.configMode ?? 'shared';
}
