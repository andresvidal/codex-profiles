import * as os from 'node:os';
import * as path from 'node:path';
import type { CodexProfile } from './profile';

export function resolveProfilePath(value: string): string {
  const trimmed = value.trim();
  const expanded = /^~(?:[\\/]|$)/.test(trimmed)
    ? path.join(os.homedir(), trimmed.slice(1).replace(/^[\\/]+/, ''))
    : trimmed;

  return path.resolve(expanded);
}

export function pathsEqual(left: string, right: string): boolean {
  const normalizedLeft = normalizeForComparison(resolveProfilePath(left));
  const normalizedRight = normalizeForComparison(resolveProfilePath(right));
  return normalizedLeft === normalizedRight;
}

export function suggestProfileHome(name: string): string {
  return path.join(os.homedir(), '.codex-profiles', slugify(name));
}

export function createUniqueProfileId(name: string, profiles: readonly CodexProfile[]): string {
  const base = slugify(name);
  const ids = new Set(profiles.map((profile) => profile.id.toLocaleLowerCase()));

  if (!ids.has(base.toLocaleLowerCase())) {
    return base;
  }

  let suffix = 2;
  while (ids.has(`${base}-${suffix}`.toLocaleLowerCase())) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'profile';
}

function normalizeForComparison(value: string): string {
  const normalized = path.normalize(value);
  return process.platform === 'win32' ? normalized.toLocaleLowerCase() : normalized;
}
