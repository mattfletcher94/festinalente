/**
 * Global Actions view capability - mechanism for global action commands TreeView.
 */

import * as vscode from 'vscode';

/**
 * Global actions group tree item (collapsible container).
 */
class GlobalActionsGroupItem extends vscode.TreeItem {
  constructor() {
    super('Global Actions', vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon('tools');
    this.contextValue = 'globalActionsGroup';
  }
}

/**
 * Global action tree item (clickable action).
 */
class GlobalActionItem extends vscode.TreeItem {
  constructor(
    label: string,
    iconName: string,
    public readonly actionCommand: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.command = {
      command: 'kanban.runGlobalAction',
      title: label,
      arguments: [{ command: actionCommand }],
    };
    this.contextValue = 'globalAction';
  }
}

/**
 * Return type for createGlobalActionsViewCapability.
 */
export interface CreateGlobalActionsViewCapabilityReturn {
  createTreeDataProvider(): vscode.TreeDataProvider<
    GlobalActionsGroupItem | GlobalActionItem
  >;
  createRefreshCallback(): () => void;
}

/**
 * Create a global actions view capability for displaying global action commands in a TreeView.
 *
 * @returns Object with createTreeDataProvider and createRefreshCallback functions.
 */
export function createGlobalActionsViewCapability(): CreateGlobalActionsViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<
    GlobalActionsGroupItem | GlobalActionItem | undefined | void
  >();

  const globalActionsGroup = new GlobalActionsGroupItem();
  const actionItems: GlobalActionItem[] = [
    new GlobalActionItem('Map Product Docs', 'book', '/kanban-map-product'),
    new GlobalActionItem(
      'Map Engineering Docs',
      'symbol-structure',
      '/kanban-map-engineering'
    ),
  ];

  function createTreeDataProvider(): vscode.TreeDataProvider<
    GlobalActionsGroupItem | GlobalActionItem
  > {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,

      getTreeItem(
        element: GlobalActionsGroupItem | GlobalActionItem
      ): vscode.TreeItem {
        return element;
      },

      getChildren(
        element?: GlobalActionsGroupItem | GlobalActionItem
      ): (GlobalActionsGroupItem | GlobalActionItem)[] {
        if (!element) {
          // Root level - return the group
          return [globalActionsGroup];
        }
        if (element instanceof GlobalActionsGroupItem) {
          // Group level - return action items
          return actionItems;
        }
        // Action items have no children
        return [];
      },
    };
  }

  function createRefreshCallback(): () => void {
    return () => onDidChangeTreeData.fire();
  }

  return {
    createTreeDataProvider,
    createRefreshCallback,
  };
}
