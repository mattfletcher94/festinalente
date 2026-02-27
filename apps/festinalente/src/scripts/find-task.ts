#!/usr/bin/env node

// Find task file by ID
// Usage: node find-task.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import { parseTaskXml } from './lib/xml-parser';

const TASKS_DIR = '.festinalente/tasks';

/**
 * Find a task file by numeric prefix.
 *
 * @param id - The task ID (e.g., "021" or "021-some-slug").
 * @returns The path and folder ID, or null if not found.
 */
function findTaskFile(id: string): { path: string; folderId: string } | null {
  const numericMatch = id.match(/^(\d+)/);
  if (!numericMatch) {
    return null;
  }
  const numericPrefix = numericMatch[1];

  if (!fs.existsSync(TASKS_DIR)) {
    return null;
  }

  const folders = fs
    .readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .map((f) => f.name);

  for (const folder of folders) {
    const folderMatch = folder.match(/^(\d+)/);
    if (folderMatch && folderMatch[1] === numericPrefix) {
      const taskPath = path.join(TASKS_DIR, folder, 'task.xml');
      if (fs.existsSync(taskPath)) {
        return { path: taskPath.replace(/\\/g, '/'), folderId: folder };
      }
    }
  }

  return null;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      JSON.stringify({ error: true, message: 'Usage: find-task.cjs <id>' })
    );
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(
      JSON.stringify({
        error: true,
        message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`,
      })
    );
    process.exit(1);
  }

  const found = findTaskFile(id);

  if (!found) {
    console.log(
      JSON.stringify({
        error: true,
        message: `Task ${id} not found in ${TASKS_DIR}/`,
      })
    );
    process.exit(1);
  }

  const content = fs.readFileSync(found.path, 'utf8');
  const parsed = parseTaskXml(content);

  const result = {
    id: found.folderId,
    filename: 'task.xml',
    path: found.path,
    title: parsed.title,
    status: parsed.status,
    priority: parsed.priority,
    labels: parsed.labels,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
