import { promises as fs } from 'node:fs';
import * as vscode from 'vscode';
import {
  addConfiguredProfile,
  getAvailableProfiles,
  isProfileHomeInUse,
  isProfileNameInUse,
} from '../configuration/configuration';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';
import { createUniqueProfileId, resolveProfilePath, suggestProfileHome } from '../profiles/profilePaths';
import type { ProfileStatusBar } from '../status/profileStatusBar';

export async function createProfile(
  store: ActiveProfileStore,
  statusBar: ProfileStatusBar,
): Promise<void> {
  const nameInput = await vscode.window.showInputBox({
    title: 'Create Codex Profile',
    prompt: 'Profile name',
    placeHolder: 'Work',
    ignoreFocusOut: true,
    validateInput: (value) => validateProfileName(value),
  });

  if (nameInput === undefined) {
    return;
  }

  const name = nameInput.trim();
  const suggestedHome = suggestProfileHome(name);
  const homeInput = await vscode.window.showInputBox({
    title: `Create Codex Profile: ${name}`,
    prompt: 'Codex home directory',
    value: suggestedHome,
    ignoreFocusOut: true,
    validateInput: (value) => validateProfileHome(value),
  });

  if (homeInput === undefined) {
    return;
  }

  const codexHome = resolveProfilePath(homeInput);
  if (isProfileHomeInUse(codexHome)) {
    await vscode.window.showErrorMessage('That Codex home is already assigned to another profile.');
    return;
  }

  if (await pathExists(codexHome)) {
    const choice = await vscode.window.showWarningMessage(
      `The directory ${codexHome} already exists. Codex Profiles will not inspect, modify, or delete its existing contents.`,
      { modal: true },
      'Use Existing Directory',
    );

    if (choice !== 'Use Existing Directory') {
      return;
    }
  } else {
    await fs.mkdir(codexHome, { recursive: true });
  }

  const profile = {
    id: createUniqueProfileId(name, getAvailableProfiles()),
    name,
    codexHome,
  };

  await addConfiguredProfile(profile);
  store.set(profile);
  statusBar.refresh();

  await vscode.window.showInformationMessage(
    `Created Codex profile “${profile.name}” at ${profile.codexHome}.`,
  );
}

function validateProfileName(value: string): string | undefined {
  const name = value.trim();
  if (name.length === 0) {
    return 'Enter a profile name.';
  }

  if (isProfileNameInUse(name)) {
    return 'A profile with that name already exists.';
  }

  return undefined;
}

function validateProfileHome(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Enter a Codex home directory.';
  }

  try {
    const resolved = resolveProfilePath(value);
    if (isProfileHomeInUse(resolved)) {
      return 'That Codex home is already assigned to another profile.';
    }
  } catch {
    return 'Enter a valid Codex home directory.';
  }

  return undefined;
}

async function pathExists(value: string): Promise<boolean> {
  try {
    await fs.access(value);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
