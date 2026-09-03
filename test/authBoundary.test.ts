import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import test from 'node:test';

const sourceRoot = path.resolve('src');

async function collectTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

test('production source does not manage Codex authentication files or SecretStorage credentials', async () => {
  const violations: string[] = [];

  for (const file of await collectTypeScriptFiles(sourceRoot)) {
    const content = await fs.readFile(file, 'utf8');
    if (/auth\.json/i.test(content)) {
      violations.push(`${path.relative(sourceRoot, file)} references auth.json`);
    }
    if (/\bsecretStorage\b/i.test(content)) {
      violations.push(`${path.relative(sourceRoot, file)} references SecretStorage`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Codex authentication must remain owned by Codex. Found:\n${violations.join('\n')}`,
  );
});
