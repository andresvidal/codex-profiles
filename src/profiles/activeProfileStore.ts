import type { CodexProfile } from './profile';

export class ActiveProfileStore {
  private activeProfile: CodexProfile | undefined;

  get(): CodexProfile | undefined {
    return this.activeProfile;
  }

  set(profile: CodexProfile | undefined): void {
    this.activeProfile = profile;
  }
}
