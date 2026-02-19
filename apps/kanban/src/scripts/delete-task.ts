#!/usr/bin/env node

// Delete task folder by ID
// Usage: node delete-task.cjs <id>
// Returns JSON with success or error

import fs from 'fs';
import path from 'path';
import { parseTaskXml } from './lib/xml-parser';

const TASKS_DIR = '.kanban/tasks';

/**
 * Output structure for successful deletion.
 */
interface DeleteSuccessResult {
  readonly success: true;
  readonly id: string;
  readonly title: string;
  readonly path: string;
}

/**
 * Output structure for deletion errors.
 */
interface DeleteErrorResult {
  readonly error: true;
  readonly message: string;
}

type DeleteResult = DeleteSuccessResult | DeleteErrorResult;

/**
 * Find task file path by ID.
 *
 * @param id - The task ID to find.
 * @returns The task file path or null if not found.
 */
function findTaskFile(id: string): string | null {
  const taskPath = path.join(TASKS_DIR, id, 'task.xml');
  if (fs.existsSync(taskPath)) {
    return taskPath.replace(/\\/g, '/');
  }
  return null;
}

/**
 * Output result as JSON and exit.
 *
 * @param result - The result to output.
 * @param exitCode - The exit code (0 for success, 1 for error).
 */
function outputResult(result: DeleteResult, exitCode: number): never {
  console.log(JSON.stringify(result, null, 2));
  process.exit(exitCode);
}

/**
 * Main function to delete a task folder.
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    outputResult({ error: true, message: 'Usage: delete-task.cjs <id>' }, 1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    outputResult({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
    }, 1);
  }

  // Find task file in folder
  const taskPath = findTaskFile(id);

  if (!taskPath) {
    outputResult({
      error: true,
      message: `Task ${id} not found in ${TASKS_DIR}/${id}/`
    }, 1);
  }

  // Read task to get title and validate status
  const content = fs.readFileSync(taskPath, 'utf8');
  const parsed = parseTaskXml(content);

  const status = parsed.status;
  const title = parsed.title;

  // Validate status - only backlog allowed
  if (status !== 'backlog') {
    outputResult({
      error: true,
      message: `Cannot delete task in ${status} status. Only backlog allowed.`
    }, 1);
  }

  // Delete the entire task folder
  const taskFolder = path.join(TASKS_DIR, id);
  fs.rmSync(taskFolder, { recursive: true, force: true });

  outputResult({
    success: true,
    id,
    title,
    path: taskPath
  }, 0);
}

main();
