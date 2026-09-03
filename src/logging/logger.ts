import * as vscode from 'vscode';

export class Logger implements vscode.Disposable {
  private readonly channel = vscode.window.createOutputChannel('Codex Profiles');

  info(message: string): void {
    this.write('INFO', message);
  }

  warn(message: string): void {
    this.write('WARN', message);
  }

  error(message: string, error?: unknown): void {
    const detail = error instanceof Error ? ` ${error.message}` : error === undefined ? '' : ` ${String(error)}`;
    this.write('ERROR', `${message}${detail}`);
  }

  dispose(): void {
    this.channel.dispose();
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
    this.channel.appendLine(`[${new Date().toISOString()}] [${level}] ${message}`);
  }
}
