/**
 * Plan symbol capability - mechanism for VSCode DocumentSymbolProvider.
 */

import * as vscode from 'vscode';
import type { PlanSymbol } from '../computers/plan-parser.computer';

/**
 * Dependencies for the plan symbol capability.
 */
export interface PlanSymbolCapabilityDeps {
  readonly parsePlanSymbols: (content: string) => PlanSymbol[];
}

/**
 * Return type for the plan symbol capability.
 */
export interface CreatePlanSymbolCapabilityReturn {
  /**
   * Create a DocumentSymbolProvider for plan.xml files.
   *
   * @returns DocumentSymbolProvider instance.
   */
  createDocumentSymbolProvider(): vscode.DocumentSymbolProvider;

  /**
   * Create a refresh callback to trigger symbol update.
   *
   * @returns Callback function that fires the change event.
   */
  createRefreshCallback(): () => void;
}

/**
 * Map PlanSymbol kind to VSCode SymbolKind.
 *
 * @param kind - The plan symbol kind.
 * @returns Corresponding VSCode SymbolKind.
 */
function mapKindToSymbolKind(kind: PlanSymbol['kind']): vscode.SymbolKind {
  switch (kind) {
    case 'plan':
      return vscode.SymbolKind.Class;
    case 'section':
      return vscode.SymbolKind.Module;
    case 'task':
      return vscode.SymbolKind.Method;
    case 'item':
      return vscode.SymbolKind.Property;
  }
}

/**
 * Create a plan symbol capability for Outline navigation.
 *
 * @param deps - Dependencies for the capability.
 * @returns Plan symbol capability with provider factory.
 */
export function createPlanSymbolCapability(deps: PlanSymbolCapabilityDeps): CreatePlanSymbolCapabilityReturn {
  const onDidChangeSymbols = new vscode.EventEmitter<void>();

  /**
   * Convert a PlanSymbol to a VSCode DocumentSymbol.
   */
  function convertToDocumentSymbol(symbol: PlanSymbol, document: vscode.TextDocument): vscode.DocumentSymbol {
    // Clamp endLine to document bounds
    const maxLine = document.lineCount - 1;
    const clampedEndLine = Math.min(symbol.endLine, maxLine);
    const clampedStartLine = Math.min(symbol.startLine, maxLine);

    const endLineLength = document.lineAt(clampedEndLine).text.length;

    const range = new vscode.Range(clampedStartLine, 0, clampedEndLine, endLineLength);
    const selectionRange = new vscode.Range(
      clampedStartLine,
      0,
      clampedStartLine,
      document.lineAt(clampedStartLine).text.length
    );

    const docSymbol = new vscode.DocumentSymbol(
      symbol.name,
      symbol.detail ?? '',
      mapKindToSymbolKind(symbol.kind),
      range,
      selectionRange
    );

    docSymbol.children = symbol.children.map((child) => convertToDocumentSymbol(child, document));

    return docSymbol;
  }

  /**
   * Create a DocumentSymbolProvider for plan.xml files.
   */
  function createDocumentSymbolProvider(): vscode.DocumentSymbolProvider {
    return {
      provideDocumentSymbols(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentSymbol[] {
        const content = document.getText();
        const symbols = deps.parsePlanSymbols(content);
        return symbols.map((s) => convertToDocumentSymbol(s, document));
      }
    };
  }

  /**
   * Create a refresh callback to trigger symbol update.
   */
  function createRefreshCallback(): () => void {
    return () => onDidChangeSymbols.fire();
  }

  return {
    createDocumentSymbolProvider,
    createRefreshCallback
  };
}
