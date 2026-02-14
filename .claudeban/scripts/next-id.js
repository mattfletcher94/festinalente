#!/usr/bin/env node

// Get the next available task ID
// Usage: node next-id.js
// Returns JSON with nextId, currentHighest, and padding

const fs = require('fs');
const path = require('path');

const TASKS_DIR = '.kanban/tasks';
const CONFIG_FILE = '.kanban/config.yaml';

function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      // Try to parse as number
      const num = parseInt(value, 10);
      result[match[1]] = isNaN(num) ? value : num;
    }
  }

  return result;
}

function extractId(filename) {
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
}

function main() {
  // Read config for padding
  let padding = 3;

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = parseSimpleYaml(content);
      if (config.idPadding) {
        padding = config.idPadding;
      }
    } catch (e) {
      // Use default padding
    }
  }

  if (!fs.existsSync(TASKS_DIR)) {
    // No tasks directory yet, start at 001
    const result = {
      nextId: '1'.padStart(padding, '0'),
      currentHighest: null,
      padding: padding
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    const result = {
      nextId: '1'.padStart(padding, '0'),
      currentHighest: null,
      padding: padding
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Find highest ID
  let highest = 0;

  for (const filename of files) {
    const id = extractId(filename);
    if (id !== null && id > highest) {
      highest = id;
    }
  }

  const nextId = (highest + 1).toString().padStart(padding, '0');
  const currentHighest = highest.toString().padStart(padding, '0');

  const result = {
    nextId: nextId,
    currentHighest: currentHighest,
    padding: padding
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
