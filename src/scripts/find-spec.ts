#!/usr/bin/env node

// Find spec file by task ID
// Usage: node find-spec.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SPECS_DIR = '.kanban/specs';

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
    console.log(JSON.stringify({ error: true, message: 'Usage: find-spec.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(SPECS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${SPECS_DIR}/ directory not found. Run /kanban-init first.`
    }));
    process.exit(1);
  }

  // Find spec file matching the ID pattern
  const pattern = `^${id}-.*\\.spec\\.md$`;
  const matches = findFiles(SPECS_DIR, pattern);

  if (matches.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: `Spec for task ${id} not found in ${SPECS_DIR}/`
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
    created: (frontmatter.created as string) || '',
    updated: (frontmatter.updated as string) || ''
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
