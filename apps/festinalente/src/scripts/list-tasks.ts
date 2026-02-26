#!/usr/bin/env node

// List all tasks with optional filtering
// Usage: node list-tasks.cjs [--status=X] [--exclude-status=X] [--label=X] [--priority=X]
// Returns JSON with array of tasks

import fs from 'fs';
import path from 'path';
import { parseTaskXml } from './lib/xml-parser';

const TASKS_DIR = '.festinalente/tasks';

interface ParsedArgs {
  _: string[];
  status?: string;
  priority?: string;
  label?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface Task {
  id: string;
  filename: string;
  path: string;
  title: string;
  status: string;
  priority: string;
  labels: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [] };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || true;
    } else {
      result._.push(arg);
    }
  }

  return result;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  // Read subdirectories (each is a task folder)
  const folders = fs.readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter(f => f.isDirectory())
    .map(f => f.name)
    .sort();

  const tasks: Task[] = [];

  for (const folderId of folders) {
    const filePath = path.join(TASKS_DIR, folderId, 'task.xml').replace(/\\/g, '/');

    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseTaskXml(content);

    const task: Task = {
      id: folderId,
      filename: 'task.xml',
      path: filePath,
      title: parsed.title,
      status: parsed.status,
      priority: parsed.priority,
      labels: parsed.labels
    };

    // Apply filters
    if (args.status && task.status !== args.status) continue;
    if (args['exclude-status'] && task.status === args['exclude-status']) continue;
    if (args.priority && task.priority !== args.priority) continue;
    if (args.label && !task.labels.includes(args.label)) continue;

    tasks.push(task);
  }

  const result = {
    count: tasks.length,
    tasks: tasks
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
