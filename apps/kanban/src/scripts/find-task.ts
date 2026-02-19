#!/usr/bin/env node

// Find task file by ID
// Usage: node find-task.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import { parseTaskXml } from './lib/xml-parser';

const TASKS_DIR = '.kanban/tasks';

function findTaskFile(id: string): string | null {
  const taskPath = path.join(TASKS_DIR, id, 'task.xml');
  if (fs.existsSync(taskPath)) {
    return taskPath.replace(/\\/g, '/');
  }
  return null;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-task.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  // Find task file in folder
  const taskPath = findTaskFile(id);

  if (!taskPath) {
    console.log(JSON.stringify({
      error: true,
      message: `Task ${id} not found in ${TASKS_DIR}/${id}/`
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(taskPath, 'utf8');
  const parsed = parseTaskXml(content);

  const result = {
    id: id,
    filename: 'task.xml',
    path: taskPath,
    title: parsed.title,
    status: parsed.status,
    priority: parsed.priority,
    labels: parsed.labels
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
