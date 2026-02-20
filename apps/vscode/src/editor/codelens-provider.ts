/**
 * CodeLens provider for task.xml files.
 * Shows action buttons and file links at the top of task files.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseTaskXml } from '../tasks/task-parser';
import { getActions } from '../tasks/task-actions';
import type { Task, TaskStatus, TaskPriority } from '../tasks/task-types';

/**
 * CodeLens provider for kanban task files.
 */
export class KanbanCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private kanbanPath: string) {}

  /**
   * Refresh CodeLenses (called when files change).
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Provide CodeLenses for a document.
   */
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] | undefined {
    // Only provide CodeLenses for task.xml files in .kanban folder
    if (!document.uri.fsPath.includes('.kanban') || !document.fileName.endsWith('task.xml')) {
      return undefined;
    }

    try {
      const content = document.getText();
      const parsed = parseTaskXml(content);

      // Build a Task object for the actions computer
      const task: Task = {
        id: parsed.id,
        title: parsed.title,
        status: parsed.status as TaskStatus,
        priority: parsed.priority as TaskPriority | undefined,
        labels: parsed.labels,
        path: path.dirname(document.uri.fsPath),
      };

      const actions = getActions(task);
      const lenses: vscode.CodeLens[] = [];
      const topLine = new vscode.Range(0, 0, 0, 0);

      // Action buttons (Scope, Plan, Implement, etc.)
      for (const action of actions) {
        lenses.push(
          new vscode.CodeLens(topLine, {
            title: `$(play) ${action.label}`,
            command: 'kanban.runAction',
            tooltip: action.description,
            arguments: [{ command: action.command, taskId: task.id }],
          })
        );
      }

      // File links
      const taskDir = path.dirname(document.uri.fsPath);

      // Spec link
      const specPath = path.join(taskDir, 'spec.xml');
      if (fs.existsSync(specPath)) {
        lenses.push(
          new vscode.CodeLens(topLine, {
            title: '$(note) Spec',
            command: 'kanban.openFile',
            tooltip: 'Open spec.xml',
            arguments: [{ filePath: specPath }],
          })
        );
      }

      // Plan link
      const planPath = path.join(taskDir, 'plan.xml');
      if (fs.existsSync(planPath)) {
        lenses.push(
          new vscode.CodeLens(topLine, {
            title: '$(list-tree) Plan',
            command: 'kanban.openFile',
            tooltip: 'Open plan.xml',
            arguments: [{ filePath: planPath }],
          })
        );
      }

      return lenses;
    } catch (err) {
      console.error('Failed to provide CodeLenses:', err);
      return undefined;
    }
  }
}
