/**
 * Directives domain types for the VSCode extension.
 */

/**
 * Branded type for directive identifiers.
 */
export type DirectiveId = string & { readonly __brand: 'DirectiveId' };

/**
 * Branded type for workflow/skill identifiers.
 */
export type WorkflowId = string & { readonly __brand: 'WorkflowId' };

/**
 * A directive assignment from config.yaml.
 */
export interface Directive {
  readonly id: DirectiveId;
  readonly name: string;
  readonly path: string;
  readonly exists: boolean;
}

/**
 * A workflow/skill with its assigned directives.
 */
export interface Workflow {
  readonly id: WorkflowId;
  readonly displayName: string;
  readonly directives: readonly Directive[];
}
