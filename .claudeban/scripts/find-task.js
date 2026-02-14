#!/usr/bin/env node

// Find task file by ID
// Usage: node find-task.js <id>
// Returns JSON with path and metadata

const fs = require('fs');
const path = require('path');

const TASKS_DIR = '.kanban/tasks';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};

  const lines = yaml.split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      let value = kvMatch[2].trim();
      // Handle quoted strings
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      // Handle arrays like [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      result[kvMatch[1]] = value;
    }
  }

  return result;
}

function findFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);
  const regex = new RegExp(pattern);

  return files
    .filter(f => regex.test(f))
    .map(f => ({ filename: f, path: path.join(dir, f).replace(/\\/g, '/') }));
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-task.js <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run /kanban:init first.`
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
  const frontmatter = parseFrontmatter(content);

  const result = {
    id: id,
    filename: file.filename,
    path: file.path,
    title: frontmatter.title || '',
    status: frontmatter.status || '',
    priority: frontmatter.priority || '',
    labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : []
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
