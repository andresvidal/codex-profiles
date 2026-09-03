import * as vscode from 'vscode';
import type { ActiveProfileStore } from '../profiles/activeProfileStore';

export class ProfileStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor(private readonly store: ActiveProfileStore) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'codexProfiles.selectProfile';
    this.refresh();
    this.item.show();
  }

  refresh(): void {
    const profile = this.store.get();
    this.item.text = profile ? `$(account) Codex: ${profile.name}` : '$(account) Codex: No Profile';
    this.item.tooltip = profile
      ? `Active Codex profile: ${profile.name}`
      : 'Select a Codex profile for this VS Code window';
  }

  dispose(): void {
    this.item.dispose();
  }
}
