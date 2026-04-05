/**
 * Directives view capability - mechanism for VSCode TreeView operations.
 */

import * as vscode from 'vscode';
import type { Directive, Workflow } from '../types/directives-types';

/**
 * Tree item types for the directives view.
 */
type DirectivesTreeItem = WorkflowItem | DirectiveItem;

/**
 * Workflow tree item (e.g., "Scope" with chevron to expand directives).
 */
export class WorkflowItem extends vscode.TreeItem {
  constructor(public readonly workflow: Workflow) {
    const hasDirectives = workflow.directives.length > 0;
    super(
      workflow.displayName,
      hasDirectives ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
    this.iconPath = new vscode.ThemeIcon('symbol-method');
    this.description = hasDirectives
      ? `${workflow.directives.length} directive${workflow.directives.length > 1 ? 's' : ''}`
      : 'No directives';
    this.contextValue = 'workflow';
  }
}

/**
 * Directive tree item (e.g., "coding" that opens the XML file on click).
 */
export class DirectiveItem extends vscode.TreeItem {
  constructor(public readonly directive: Directive) {
    super(directive.name, vscode.TreeItemCollapsibleState.None);

    if (directive.exists) {
      this.iconPath = new vscode.ThemeIcon('symbol-ruler');
      this.command = {
        command: 'festinalente.openFile',
        title: 'Open Directive',
        arguments: [{ filePath: directive.path }]
      };
      this.contextValue = 'directive';
    } else {
      this.iconPath = new vscode.ThemeIcon('warning');
      this.tooltip = `Directive file not found: ${directive.path}`;
      this.contextValue = 'directive-missing';
    }
  }
}

/**
 * Dependencies required by the directives view capability.
 */
export interface DirectivesViewCapabilityDeps {
  /**
   * Load all workflows with their directives.
   */
  loadWorkflows: () => Workflow[];
}

/**
 * Return type for the directives view capability factory.
 */
export interface CreateDirectivesViewCapabilityReturn {
  /**
   * Create a TreeDataProvider for the directives view.
   */
  createTreeDataProvider(): vscode.TreeDataProvider<DirectivesTreeItem>;

  /**
   * Create a refresh callback to trigger tree updates.
   */
  createRefreshCallback(): () => void;
}

/**
 * Create a directives view capability for TreeView operations.
 *
 * @param deps - Dependencies for the capability.
 * @returns Directives view capability with TreeDataProvider.
 */
export function createDirectivesViewCapability(
  deps: DirectivesViewCapabilityDeps
): CreateDirectivesViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<DirectivesTreeItem | undefined | void>();

  // Cache for TreeItems to enable reveal() to work with same references
  let _cachedWorkflowItems: WorkflowItem[] | null = null;
  // Parent tracking for getParent() - enables reveal() to traverse tree
  const directiveToWorkflow: Map<DirectiveItem, WorkflowItem> = new Map();

  /**
   * Create a TreeDataProvider for the directives view.
   */
  function createTreeDataProvider(): vscode.TreeDataProvider<DirectivesTreeItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,

      getTreeItem(element: DirectivesTreeItem): vscode.TreeItem {
        return element;
      },

      getChildren(element?: DirectivesTreeItem): DirectivesTreeItem[] {
        if (!element) {
          return getWorkflowItems();
        }

        if (element instanceof WorkflowItem) {
          return getDirectiveItems(element);
        }

        return [];
      },

      getParent(element: DirectivesTreeItem): DirectivesTreeItem | undefined {
        if (element instanceof WorkflowItem) {
          return undefined;
        }

        if (element instanceof DirectiveItem) {
          return directiveToWorkflow.get(element);
        }

        return undefined;
      }
    };
  }

  /**
   * Get all workflow items at the root level.
   */
  function getWorkflowItems(): WorkflowItem[] {
    const workflows = deps.loadWorkflows();
    const items = workflows.map((workflow) => new WorkflowItem(workflow));

    // Update cache
    _cachedWorkflowItems = items;

    return items;
  }

  /**
   * Get directive items for a workflow.
   */
  function getDirectiveItems(workflowItem: WorkflowItem): DirectiveItem[] {
    const items = workflowItem.workflow.directives.map((directive) => new DirectiveItem(directive));

    // Track parent for getParent()
    items.forEach((item) => {
      directiveToWorkflow.set(item, workflowItem);
    });

    return items;
  }

  /**
   * Create a refresh callback to trigger tree updates.
   */
  function createRefreshCallback(): () => void {
    return () => {
      // Clear caches on refresh
      _cachedWorkflowItems = null;
      directiveToWorkflow.clear();
      onDidChangeTreeData.fire();
    };
  }

  return {
    createTreeDataProvider,
    createRefreshCallback
  };
}
