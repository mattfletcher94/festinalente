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

/**
 * Severity level for directive validation diagnostics.
 */
export type DirectiveValidationSeverity = 'error' | 'warning';

/**
 * A single validation error with context for line mapping.
 */
export interface DirectiveValidationError {
  readonly message: string;
  readonly severity: DirectiveValidationSeverity;
  readonly elementTag: string;
  readonly elementId: string | undefined;
  readonly elementIndex: number | undefined;
}

/**
 * Result of validating a directive XML file.
 */
export interface DirectiveValidationResult {
  readonly valid: boolean;
  readonly errors: readonly DirectiveValidationError[];
}
