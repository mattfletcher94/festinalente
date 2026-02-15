#!/usr/bin/env node

// List all tasks with optional filtering
// Usage: node list-tasks.cjs [--status=X] [--label=X] [--priority=X]
// Returns JSON with array of tasks

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TASKS_DIR = '.kanban/tasks';

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

function extractId(filename: string): string | null {
  const match = filename.match(/^(\d+)-/);
  return match ? match[1] : null;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run /kanban-init first.`
    }));
    process.exit(1);
  }

  const files = fs.readdirSync(TASKS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const tasks: Task[] = [];

  for (const filename of files) {
    const filePath = path.join(TASKS_DIR, filename).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter } = matter(content);
    const id = extractId(filename);

    if (!id) continue;

    const task: Task = {
      id: id,
      filename: filename,
      path: filePath,
      title: (frontmatter.title as string) || '',
      status: (frontmatter.status as string) || '',
      priority: (frontmatter.priority as string) || '',
      labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : []
    };

    // Apply filters
    if (args.status && task.status !== args.status) continue;
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
