import type { CodexProfile } from './profile';

export class ActiveProfileStore {
  constructor(private activeProfile: CodexProfile) {}

  get(): CodexProfile {
    return this.activeProfile;
  }

  set(profile: CodexProfile): void {
    this.activeProfile = profile;
  }
}
