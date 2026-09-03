import assert from 'node:assert/strict';
import test from 'node:test';
import { createCodexTerminalLaunchPlan } from '../src/session/codexTerminalLaunchPlan';

test('terminal launch plan changes only CODEX_HOME and runs the normal codex command', () => {
  const plan = createCodexTerminalLaunchPlan({
    id: 'work',
    name: 'Work',
    codexHome: '/profiles/work',
    configMode: 'shared',
  });

  assert.equal(plan.name, 'Codex (Work)');
  assert.equal(plan.command, 'codex');
  assert.deepEqual(plan.env, { CODEX_HOME: '/profiles/work' });
});
