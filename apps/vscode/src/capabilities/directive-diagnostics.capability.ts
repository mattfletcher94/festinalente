/**
 * Directive diagnostics capability - mechanism for mapping validation errors to editor diagnostics.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import type { CreateDirectiveValidatorComputerReturn } from '../computers/directive-validator.computer';
import type { DirectiveValidationSeverity } from '../types/directives-types';

/**
 * Dependencies for the directive diagnostics capability.
 */
export interface DirectiveDiagnosticsCapabilityDeps {
  readonly validator: CreateDirectiveValidatorComputerReturn;
}

/**
 * Return type for the directive diagnostics capability.
 */
export interface CreateDirectiveDiagnosticsCapabilityReturn {
  /**
   * Validate a document and set diagnostics based on validation errors.
   *
   * @param document - The text document to validate.
   */
  validateDocument(document: vscode.TextDocument): void;

  /**
   * Clear diagnostics for a given URI.
   *
   * @param uri - The URI to clear diagnostics for.
   */
  clearDiagnostics(uri: vscode.Uri): void;

  /**
   * Dispose the diagnostic collection.
   */
  dispose(): void;
}

/**
 * Map a directive validation severity to a VSCode diagnostic severity.
 *
 * @param severity - The directive validation severity.
 * @returns The corresponding VSCode diagnostic severity.
 */
function mapSeverity(severity: DirectiveValidationSeverity): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
  }
}

/**
 * Find the 0-based line number for a given XML element in the text.
 *
 * @param text - The full document text.
 * @param elementTag - The XML tag name to search for.
 * @param elementId - The optional element id attribute to match.
 * @returns The 0-based line number, or 0 as fallback.
 */
function findLineForElement(text: string, elementTag: string, elementId: string | undefined): number {
  const lines = text.split('\n');

  if (elementId) {
    const idPattern = new RegExp(`<${elementTag}\\b[^>]*id\\s*=\\s*"${elementId}"`);
    for (let i = 0; i < lines.length; i++) {
      if (idPattern.test(lines[i])) {
        return i;
      }
    }
  }

  const tagPattern = new RegExp(`<${elementTag}(\\s|>)`);
  for (let i = 0; i < lines.length; i++) {
    if (tagPattern.test(lines[i])) {
      return i;
    }
  }

  return 0;
}

/**
 * Create a directive diagnostics capability for mapping validation errors to editor diagnostics.
 *
 * @param deps - Dependencies for the capability.
 * @returns Directive diagnostics capability with validate, clear, and dispose methods.
 */
export function createDirectiveDiagnosticsCapability(
  deps: DirectiveDiagnosticsCapabilityDeps
): CreateDirectiveDiagnosticsCapabilityReturn {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('festinalente-directives');

  /**
   * Validate a document and set diagnostics based on validation errors.
   */
  function validateDocument(document: vscode.TextDocument): void {
    const content = document.getText();
    const filename = path.basename(document.uri.fsPath);
    const expectedName = filename.replace(/\.xml$/, '');

    const result = deps.validator.validateDirective(content, expectedName);

    if (result.errors.length === 0) {
      diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = result.errors.map((error) => {
      const line = findLineForElement(content, error.elementTag, error.elementId);
      const lineText = document.lineAt(line).text;
      const range = new vscode.Range(line, 0, line, lineText.length);

      const diagnostic = new vscode.Diagnostic(range, error.message, mapSeverity(error.severity));
      diagnostic.source = 'festinalente';

      return diagnostic;
    });

    diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Clear diagnostics for a given URI.
   */
  function clearDiagnostics(uri: vscode.Uri): void {
    diagnosticCollection.delete(uri);
  }

  /**
   * Dispose the diagnostic collection.
   */
  function dispose(): void {
    diagnosticCollection.dispose();
  }

  return {
    validateDocument,
    clearDiagnostics,
    dispose
  };
}
