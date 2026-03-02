/**
 * CodeLens capability - mechanism for VSCode CodeLens operations.
 */

import * as vscode from 'vscode';
import type { Task, TaskAction } from '../types/task-types';

export interface CodeLensCapabilityDeps {
  parseTaskFromUri: (uri: vscode.Uri) => Task | undefined;
  getActions: (task: Task) => readonly TaskAction[];
}

export interface CreateCodeLensCapabilityReturn {
  createCodeLensProvider(): vscode.CodeLensProvider;
  createRefreshCallback(): () => void;
}

export function createCodeLensCapability(
  deps: CodeLensCapabilityDeps
): CreateCodeLensCapabilityReturn {
  const onDidChangeCodeLenses = new vscode.EventEmitter<void>();

  function createCodeLensProvider(): vscode.CodeLensProvider {
    return {
      onDidChangeCodeLenses: onDidChangeCodeLenses.event,

      provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
      ): vscode.CodeLens[] {
        const task = deps.parseTaskFromUri(document.uri);
        if (!task) {
          return [];
        }

        const actions = deps.getActions(task);
        const lenses: vscode.CodeLens[] = [];

        // Place CodeLens at line 0
        const range = new vscode.Range(0, 0, 0, 0);

        for (const action of actions) {
          lenses.push(
            new vscode.CodeLens(range, {
              title: action.label,
              tooltip: action.description,
              command: 'festinalente.runAction',
              arguments: [{ command: action.command, taskId: task.id }],
            })
          );
        }

        return lenses;
      },
    };
  }

  function createRefreshCallback(): () => void {
    return () => onDidChangeCodeLenses.fire();
  }

  return {
    createCodeLensProvider,
    createRefreshCallback,
  };
}
