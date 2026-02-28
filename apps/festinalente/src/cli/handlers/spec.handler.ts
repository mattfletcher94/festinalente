/**
 * Spec handler - commands for spec and plan operations.
 *
 * @module cli/handlers/spec
 */

import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import type { CliResult, CliCommand } from '../types';
import { success, error } from '../types';
import { defineCommand } from '../registry';

const TASKS_DIR = '.festinalente/tasks';

/**
 * Spec info result.
 */
export interface SpecInfo {
  readonly id: string;
  readonly filename: string;
  readonly path: string;
  readonly task: string;
  readonly created: string;
  readonly updated: string;
}

/**
 * Plan info result.
 */
export interface PlanInfo {
  readonly id: string;
  readonly filename: string;
  readonly path: string;
  readonly task: string;
  readonly spec: string;
  readonly status: string;
  readonly iteration: number;
}

/**
 * Dependencies for spec handler.
 */
export interface SpecHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly xmlParser: XmlParserComputer;
}

/**
 * Spec handler interface.
 */
export interface SpecHandler {
  readonly findSpec: (args: string[]) => CliResult<SpecInfo>;
  readonly findPlan: (args: string[]) => CliResult<PlanInfo>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a spec handler.
 *
 * @param deps - The dependencies.
 * @returns A SpecHandler instance.
 */
export function createSpecHandler(deps: SpecHandlerDeps): SpecHandler {
  const { fs, xmlParser } = deps;

  /**
   * Find spec command.
   */
  function findSpec(args: string[]): CliResult<SpecInfo> {
    if (args.length === 0) {
      return error('Usage: find-spec <id>');
    }

    const id = args[0];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const specPath = fs.joinPath(TASKS_DIR, id, 'spec.xml').replace(/\\/g, '/');

    if (!fs.exists(specPath)) {
      return error(`Spec for task ${id} not found in ${TASKS_DIR}/${id}/`);
    }

    const readResult = fs.readFile(specPath);
    if (!readResult.ok) {
      return error(`Failed to read spec file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseSpecXml(readResult.value);

    return success({
      id,
      filename: 'spec.xml',
      path: specPath,
      task: parsed.task || id,
      created: parsed.created,
      updated: parsed.updated,
    });
  }

  /**
   * Find plan command.
   */
  function findPlan(args: string[]): CliResult<PlanInfo> {
    if (args.length === 0) {
      return error('Usage: find-plan <id>');
    }

    const id = args[0];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const planPath = fs.joinPath(TASKS_DIR, id, 'plan.xml').replace(/\\/g, '/');

    if (!fs.exists(planPath)) {
      return error(`Plan for task ${id} not found in ${TASKS_DIR}/${id}/`);
    }

    const readResult = fs.readFile(planPath);
    if (!readResult.ok) {
      return error(`Failed to read plan file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parsePlanXml(readResult.value);

    return success({
      id,
      filename: 'plan.xml',
      path: planPath,
      task: parsed.task || id,
      spec: parsed.spec,
      status: parsed.status,
      iteration: parsed.iteration,
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'find-spec',
        'Find a spec file by task ID',
        'find-spec <id>',
        findSpec
      ),
      defineCommand(
        'find-plan',
        'Find a plan file by task ID',
        'find-plan <id>',
        findPlan
      ),
    ];
  }

  return {
    findSpec,
    findPlan,
    getCommands,
  };
}
