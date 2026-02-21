/**
 * Config view capability - mechanism for config.yaml TreeView.
 */

import * as vscode from 'vscode';

/**
 * Config file tree item.
 */
class ConfigItem extends vscode.TreeItem {
  constructor(filePath: string) {
    super('config.yaml', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('gear');
    this.command = {
      command: 'kanban.openFile',
      title: 'Open Config',
      arguments: [{ filePath }],
    };
    this.contextValue = 'config';
    this.resourceUri = vscode.Uri.file(filePath);
  }
}

/**
 * Dependencies for the config view capability.
 */
export interface ConfigViewCapabilityDeps {
  checkConfigExists: () => boolean;
  getConfigPath: () => string;
}

/**
 * Return type for createConfigViewCapability.
 */
export interface CreateConfigViewCapabilityReturn {
  createTreeDataProvider(): vscode.TreeDataProvider<ConfigItem>;
  createRefreshCallback(): () => void;
}

/**
 * Create a config view capability for displaying config.yaml in a TreeView.
 *
 * @param deps - Dependencies for checking config existence and getting path.
 * @returns Object with createTreeDataProvider and createRefreshCallback functions.
 */
export function createConfigViewCapability(
  deps: ConfigViewCapabilityDeps
): CreateConfigViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<ConfigItem | undefined | void>();

  function createTreeDataProvider(): vscode.TreeDataProvider<ConfigItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,

      getTreeItem(element: ConfigItem): vscode.TreeItem {
        return element;
      },

      getChildren(): ConfigItem[] {
        if (deps.checkConfigExists()) {
          return [new ConfigItem(deps.getConfigPath())];
        }
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
