import type { CodexProfile } from '../profiles/profile';
import { createCodexSessionEnvironment } from './sessionEnvironment';

export interface CodexTerminalLaunchPlan {
  readonly name: string;
  readonly env: Readonly<Record<string, string>>;
  readonly command: string;
}

export function createCodexTerminalLaunchPlan(profile: CodexProfile): CodexTerminalLaunchPlan {
  return {
    name: `Codex (${profile.name})`,
    env: createCodexSessionEnvironment(profile),
    command: 'codex',
  };
}
