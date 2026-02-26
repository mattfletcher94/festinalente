#!/usr/bin/env node

// Get the next available task ID
// Usage: node next-id.cjs
// Returns JSON with nextId, currentHighest, and padding

import fs from 'fs';

const TASKS_DIR = '.festinalente/tasks';
const CONFIG_FILE = '.festinalente/config.yaml';

interface SimpleYamlResult {
  idPadding?: number;
  [key: string]: string | number | undefined;
}

function parseSimpleYaml(content: string): SimpleYamlResult {
  const result: SimpleYamlResult = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      let value: string = match[2].trim();
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

function main(): void {
  // Read config for padding
  let padding = 3;

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = parseSimpleYaml(content);
      if (config.idPadding) {
        padding = config.idPadding;
      }
    } catch {
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

  // Read folder names (each folder name IS the ID)
  const folders = fs.readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter(f => f.isDirectory())
    .map(f => f.name);

  if (folders.length === 0) {
    const result = {
      nextId: '1'.padStart(padding, '0'),
      currentHighest: null,
      padding: padding
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Find highest ID (folder names are "001", "002", etc.)
  let highest = 0;

  for (const folderName of folders) {
    const id = parseInt(folderName, 10);
    if (!isNaN(id) && id > highest) {
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
