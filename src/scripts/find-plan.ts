#!/usr/bin/env node

// Find plan file by task ID
// Usage: node find-plan.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PLANS_DIR = '.kanban/plans';

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
    console.log(JSON.stringify({ error: true, message: 'Usage: find-plan.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(PLANS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${PLANS_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  // Find plan file matching the ID pattern
  const pattern = `^${id}-.*\\.plan\\.md$`;
  const matches = findFiles(PLANS_DIR, pattern);

  if (matches.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: `Plan for task ${id} not found in ${PLANS_DIR}/`
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
    task: (frontmatter.task as string) || id,
    spec: (frontmatter.spec as string) || '',
    status: (frontmatter.status as string) || '',
    iteration: parseInt((frontmatter.iteration as string) || '1', 10) || 1
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
