/**
 * Docs view capability - mechanism for Product and Engineering docs TreeViews.
 * Provides recursive folder traversal with path-based parent tracking.
 * Includes action items at the top of each section for doc mapping commands.
 */

import * as vscode from 'vscode';

/**
 * Action item tree item (clickable command at top of section).
 */
export class DocsActionItem extends vscode.TreeItem {
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
    this.contextValue = 'docsAction';
  }
}

/**
 * Docs folder tree item (collapsible container).
 */
export class DocsFolderItem extends vscode.TreeItem {
  constructor(
    public readonly folderPath: string,
    name: string,
    isExpanded: boolean = false
  ) {
    super(
      name,
      isExpanded
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.iconPath = new vscode.ThemeIcon('folder');
    this.contextValue = 'docsFolder';
  }
}

/**
 * Docs file tree item (clickable leaf).
 */
export class DocsFileItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    name: string
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('file-text');
    this.command = {
      command: 'kanban.openFile',
      title: 'Open',
      arguments: [{ filePath }],
    };
    this.contextValue = 'docsFile';
  }
}

/**
 * Combined type for all docs tree items.
 */
export type DocsTreeItem = DocsActionItem | DocsFolderItem | DocsFileItem;

/**
 * Dependencies for docs view capability.
 */
export interface DocsViewCapabilityDeps {
  readDir: (dirPath: string) => string[];
  isDirectory: (filePath: string) => boolean;
  exists: (filePath: string) => boolean;
  joinPath: (...parts: string[]) => string;
}

/**
 * Return type for createDocsViewCapability.
 */
export interface CreateDocsViewCapabilityReturn {
  createProductDocsProvider(): vscode.TreeDataProvider<DocsTreeItem>;
  createEngineeringDocsProvider(): vscode.TreeDataProvider<DocsTreeItem>;
  createProductRefresh(): () => void;
  createEngineeringRefresh(): () => void;
}

/**
 * Create a docs view capability for displaying product and engineering docs in TreeViews.
 *
 * @param deps - File system operations dependency injection
 * @param kanbanPath - Path to the .kanban folder
 * @returns Object with factory functions for creating providers and refresh callbacks
 */
export function createDocsViewCapability(
  deps: DocsViewCapabilityDeps,
  kanbanPath: string
): CreateDocsViewCapabilityReturn {
  const { readDir, isDirectory, exists, joinPath } = deps;

  // EventEmitters for each TreeView
  const productEmitter = new vscode.EventEmitter<DocsTreeItem | undefined | void>();
  const engineeringEmitter = new vscode.EventEmitter<DocsTreeItem | undefined | void>();

  // Parent tracking maps (path -> parent item)
  let productParentMap = new Map<string, DocsTreeItem>();
  let engineeringParentMap = new Map<string, DocsTreeItem>();

  /**
   * Get children for a given directory path.
   * Filters to only include .md files and directories.
   */
  function getChildrenForPath(
    basePath: string,
    parentItem: DocsTreeItem | undefined,
    parentMap: Map<string, DocsTreeItem>
  ): DocsTreeItem[] {
    if (!exists(basePath)) {
      return [];
    }

    const entries = readDir(basePath);
    const items: DocsTreeItem[] = [];

    for (const entry of entries) {
      const fullPath = joinPath(basePath, entry);

      if (isDirectory(fullPath)) {
        const folderItem = new DocsFolderItem(fullPath, entry, false);
        items.push(folderItem);
        if (parentItem) {
          parentMap.set(fullPath, parentItem);
        }
      } else if (entry.endsWith('.md')) {
        const fileItem = new DocsFileItem(fullPath, entry);
        items.push(fileItem);
        if (parentItem) {
          parentMap.set(fullPath, parentItem);
        }
      }
    }

    // Sort: folders first, then files, both alphabetically
    items.sort((a, b) => {
      const aIsFolder = a instanceof DocsFolderItem;
      const bIsFolder = b instanceof DocsFolderItem;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.label!.toString().localeCompare(b.label!.toString());
    });

    return items;
  }

  /**
   * Create a TreeDataProvider for a specific docs folder.
   */
  function createDocsProvider(
    docsFolder: string,
    actionItem: DocsActionItem,
    emitter: vscode.EventEmitter<DocsTreeItem | undefined | void>,
    parentMap: Map<string, DocsTreeItem>
  ): vscode.TreeDataProvider<DocsTreeItem> {
    const docsPath = joinPath(kanbanPath, docsFolder);

    return {
      onDidChangeTreeData: emitter.event,

      getTreeItem(element: DocsTreeItem): vscode.TreeItem {
        return element;
      },

      getChildren(element?: DocsTreeItem): DocsTreeItem[] {
        if (!element) {
          // Root level - action item first, then docs folder children
          const children = getChildrenForPath(docsPath, undefined, parentMap);
          return [actionItem, ...children];
        }
        if (element instanceof DocsFolderItem) {
          // Folder - get its children
          return getChildrenForPath(element.folderPath, element, parentMap);
        }
        // Action items and files have no children
        return [];
      },

      getParent(element: DocsTreeItem): DocsTreeItem | undefined {
        if (element instanceof DocsActionItem) {
          // Action items are at root level
          return undefined;
        }
        const itemPath = element instanceof DocsFolderItem ? element.folderPath : element.filePath;
        return parentMap.get(itemPath);
      },
    };
  }

  // Action items for each docs section
  const productActionItem = new DocsActionItem(
    'Map Product Docs',
    'book',
    '/kanban-map-product'
  );
  const engineeringActionItem = new DocsActionItem(
    'Map Engineering Docs',
    'symbol-structure',
    '/kanban-map-engineering'
  );

  function createProductDocsProvider(): vscode.TreeDataProvider<DocsTreeItem> {
    return createDocsProvider('product', productActionItem, productEmitter, productParentMap);
  }

  function createEngineeringDocsProvider(): vscode.TreeDataProvider<DocsTreeItem> {
    return createDocsProvider('engineering', engineeringActionItem, engineeringEmitter, engineeringParentMap);
  }

  function createProductRefresh(): () => void {
    return () => {
      productParentMap = new Map<string, DocsTreeItem>();
      productEmitter.fire();
    };
  }

  function createEngineeringRefresh(): () => void {
    return () => {
      engineeringParentMap = new Map<string, DocsTreeItem>();
      engineeringEmitter.fire();
    };
  }

  return {
    createProductDocsProvider,
    createEngineeringDocsProvider,
    createProductRefresh,
    createEngineeringRefresh,
  };
}
