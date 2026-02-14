#!/usr/bin/env node

// List all tasks with optional filtering
// Usage: node list-tasks.js [--status=X] [--label=X] [--priority=X]
// Returns JSON with array of tasks

const fs = require('fs');
const path = require('path');

const TASKS_DIR = '.kanban/tasks';

function parseArgs(args) {
  const result = { _: [] };

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

function extractId(filename) {
  const match = filename.match(/^(\d+)-/);
  return match ? match[1] : null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run /kanban:init first.`
    }));
    process.exit(1);
  }

  const files = fs.readdirSync(TASKS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const tasks = [];

  for (const filename of files) {
    const filePath = path.join(TASKS_DIR, filename).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const id = extractId(filename);

    if (!id) continue;

    const task = {
      id: id,
      filename: filename,
      path: filePath,
      title: frontmatter.title || '',
      status: frontmatter.status || '',
      priority: frontmatter.priority || '',
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
