/**
 * Spec handler - commands for spec and plan operations.
 *
 * @module cli/handlers/spec
 */

import type { CliCommand, CliResult } from '../types';
import { error, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import type { TaskResolverComputer } from '../computers/task-resolver.computer';
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
  readonly taskResolver: TaskResolverComputer;
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
  const { fs, xmlParser, taskResolver } = deps;

  /**
   * Resolve a task ID (prefix or full) to the actual folder name.
   */
  function resolveTaskId(id: string): string | null {
    if (!fs.exists(TASKS_DIR)) return null;
    const result = fs.listDirectories(TASKS_DIR);
    if (!result.ok) return null;
    return taskResolver.resolveTaskFolder(result.value, id);
  }

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

    const resolvedId = resolveTaskId(id) ?? id;
    const specPath = fs.joinPath(TASKS_DIR, resolvedId, 'spec.xml').replace(/\\/g, '/');

    if (!fs.exists(specPath)) {
      return error(`No task found matching '${id}'`);
    }

    const readResult = fs.readFile(specPath);
    if (!readResult.ok) {
      return error(`Failed to read spec file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseSpecXml(readResult.value);

    return success({
      id: resolvedId,
      filename: 'spec.xml',
      path: specPath,
      task: parsed.task || resolvedId,
      created: parsed.created,
      updated: parsed.updated
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

    const resolvedId = resolveTaskId(id) ?? id;
    const planPath = fs.joinPath(TASKS_DIR, resolvedId, 'plan.xml').replace(/\\/g, '/');

    if (!fs.exists(planPath)) {
      return error(`No task found matching '${id}'`);
    }

    const readResult = fs.readFile(planPath);
    if (!readResult.ok) {
      return error(`Failed to read plan file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parsePlanXml(readResult.value);

    return success({
      id: resolvedId,
      filename: 'plan.xml',
      path: planPath,
      task: parsed.task || resolvedId,
      spec: parsed.spec,
      status: parsed.status,
      iteration: parsed.iteration
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand('find-spec', 'Find a spec file by task ID', 'find-spec <id>', findSpec),
      defineCommand('find-plan', 'Find a plan file by task ID', 'find-plan <id>', findPlan)
    ];
  }

  return {
    findSpec,
    findPlan,
    getCommands
  };
}
