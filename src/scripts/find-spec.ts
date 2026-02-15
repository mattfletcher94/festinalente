#!/usr/bin/env node

// Find spec file by task ID
// Usage: node find-spec.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';

const SPECS_DIR = '.kanban/specs';

interface Frontmatter {
  task?: string;
  created?: string;
  updated?: string;
  [key: string]: string | undefined;
}

interface FileMatch {
  filename: string;
  path: string;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: Frontmatter = {};

  const lines = yaml.split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      let value = kvMatch[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      result[kvMatch[1]] = value;
    }
  }

  return result;
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
      message: `${SPECS_DIR}/ directory not found. Run /kanban:init first.`
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
  const frontmatter = parseFrontmatter(content);

  const result = {
    id: id,
    filename: file.filename,
    path: file.path,
    task: frontmatter.task || id,
    created: frontmatter.created || '',
    updated: frontmatter.updated || ''
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
