/**
 * Quicks view capability - mechanism for VSCode TreeView operations.
 * Displays quick tasks as a flat list with status-based icons.
 */

import * as vscode from 'vscode';
import type { Quick } from '../types/quick-types';

/**
 * Quick item tree item (clickable leaf node).
 */
export class QuickItem extends vscode.TreeItem {
  constructor(public readonly quick: Quick) {
    super(`${quick.id}: ${quick.title}`, vscode.TreeItemCollapsibleState.None);
    this.description = quick.status;
    this.iconPath = this.getStatusIcon();
    this.command = {
      command: 'festinalente.openFile',
      title: 'Open Quick',
      arguments: [{ filePath: quick.quickPath }]
    };
    this.contextValue = 'quickItem';
  }

  private getStatusIcon(): vscode.ThemeIcon {
    switch (this.quick.status) {
      case 'completed':
        return new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('charts.green'));
      case 'in-progress':
        return new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('charts.blue'));
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * Dependencies for quicks view capability.
 */
export interface QuicksViewCapabilityDeps {
  loadQuicks: () => Quick[];
}

/**
 * Return type for createQuicksViewCapability.
 */
export interface CreateQuicksViewCapabilityReturn {
  createTreeDataProvider(): vscode.TreeDataProvider<QuickItem>;
  createRefreshCallback(): () => void;
  findQuickItem(quickId: string): QuickItem | undefined;
}

/**
 * Create a quicks view capability for displaying quick tasks in a TreeView.
 *
 * @param deps - Dependencies for loading quick tasks.
 * @returns Object with factory functions for provider, refresh callback, and find.
 */
export function createQuicksViewCapability(deps: QuicksViewCapabilityDeps): CreateQuicksViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<QuickItem | undefined | void>();
  const cachedQuickItems: Map<string, QuickItem> = new Map();

  function createTreeDataProvider(): vscode.TreeDataProvider<QuickItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,
      getTreeItem(element: QuickItem): vscode.TreeItem {
        return element;
      },
      getChildren(element?: QuickItem): QuickItem[] {
        if (element) return [];
        cachedQuickItems.clear();
        const quicks = deps.loadQuicks();
        const items = quicks.map((q) => {
          const item = new QuickItem(q);
          cachedQuickItems.set(q.id, item);
          return item;
        });
        return items;
      },
      getParent(): undefined {
        return undefined;
      }
    };
  }

  function createRefreshCallback(): () => void {
    return () => {
      cachedQuickItems.clear();
      onDidChangeTreeData.fire();
    };
  }

  function findQuickItem(quickId: string): QuickItem | undefined {
    return cachedQuickItems.get(quickId);
  }

  return {
    createTreeDataProvider,
    createRefreshCallback,
    findQuickItem
  };
}
