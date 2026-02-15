#!/usr/bin/env node

// Find task file by ID
// Usage: node find-task.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TASKS_DIR = '.kanban/tasks';

interface FileMatch {
  filename: string;
  path: string;
}

function findFiles(dir: string, pattern: string): FileMatch[] {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);
  const regex = new RegExp(pattern);

  return files
    .filter(f => regex.test(f))
    .map(f => ({ filename: f, path: path.join(dir, f).replace(/\\/g, '/') }));
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
      message: `${TASKS_DIR}/ directory not found. Run /kanban-init first.`
    }));
    process.exit(1);
  }

  // Find task file matching the ID pattern
  const pattern = `^${id}-.*\\.md$`;
  const matches = findFiles(TASKS_DIR, pattern);

  if (matches.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: `Task ${id} not found in ${TASKS_DIR}/`
    }));
    process.exit(1);
  }

  const file = matches[0];
  const content = fs.readFileSync(file.path, 'utf8');
  const { data: frontmatter } = matter(content);

  const result = {
    id: id,
    filename: file.filename,
    path: file.path,
    title: (frontmatter.title as string) || '',
    status: (frontmatter.status as string) || '',
    priority: (frontmatter.priority as string) || '',
    labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : []
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
