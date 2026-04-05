/**
 * Quick handler - commands for quick task operations.
 *
 * @module cli/handlers/quick
 */

import type { CliCommand, CliResult } from '../types';
import { error, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import { defineCommand } from '../registry';

const QUICK_DIR = '.festinalente/quick';

/**
 * Quick info result.
 */
export interface QuickInfo {
  readonly id: string;
  readonly filename: string;
  readonly path: string;
  readonly title: string;
  readonly created: string;
  readonly updated: string;
}

/**
 * Next quick ID result.
 */
export interface NextQuickIdResult {
  readonly nextId: string;
  readonly currentHighest: string | null;
  readonly padding: number;
}

/**
 * Dependencies for quick handler.
 */
export interface QuickHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly xmlParser: XmlParserComputer;
}

/**
 * Quick handler interface.
 */
export interface QuickHandler {
  readonly findQuick: (args: string[]) => CliResult<QuickInfo>;
  readonly nextQuickId: (args: string[]) => CliResult<NextQuickIdResult>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a quick handler.
 *
 * @param deps - The dependencies.
 * @returns A QuickHandler instance.
 */
export function createQuickHandler(deps: QuickHandlerDeps): QuickHandler {
  const { fs, xmlParser } = deps;

  /**
   * Find quick command.
   */
  function findQuick(args: string[]): CliResult<QuickInfo> {
    if (args.length === 0) {
      return error('Usage: find-quick <id>');
    }

    const id = args[0];

    if (!fs.exists(QUICK_DIR)) {
      return error(`${QUICK_DIR}/ directory not found. No quick tasks exist yet.`);
    }

    const quickPath = fs.joinPath(QUICK_DIR, id, 'quick.xml').replace(/\\/g, '/');

    if (!fs.exists(quickPath)) {
      return error(`Quick task ${id} not found in ${QUICK_DIR}/${id}/`);
    }

    const readResult = fs.readFile(quickPath);
    if (!readResult.ok) {
      return error(`Failed to read quick file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseQuickXml(readResult.value);

    return success({
      id,
      filename: 'quick.xml',
      path: quickPath,
      title: parsed.title,
      created: parsed.created,
      updated: parsed.updated
    });
  }

  /**
   * Next quick ID command.
   */
  function nextQuickId(_args: string[]): CliResult<NextQuickIdResult> {
    const padding = 3;

    if (!fs.exists(QUICK_DIR)) {
      return success({
        nextId: '0'.padStart(padding, '0'),
        currentHighest: null,
        padding
      });
    }

    const dirsResult = fs.listDirectories(QUICK_DIR);
    if (!dirsResult.ok || dirsResult.value.length === 0) {
      return success({
        nextId: '0'.padStart(padding, '0'),
        currentHighest: null,
        padding
      });
    }

    // Find highest ID
    let highest = -1;

    for (const folderName of dirsResult.value) {
      const id = parseInt(folderName, 10);
      if (!isNaN(id) && id > highest) {
        highest = id;
      }
    }

    const nextId = (highest + 1).toString().padStart(padding, '0');
    const currentHighest = highest >= 0 ? highest.toString().padStart(padding, '0') : null;

    return success({
      nextId,
      currentHighest,
      padding
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand('find-quick', 'Find a quick task by ID', 'find-quick <id>', findQuick),
      defineCommand('next-quick-id', 'Get the next available quick task ID', 'next-quick-id', nextQuickId)
    ];
  }

  return {
    findQuick,
    nextQuickId,
    getCommands
  };
}
