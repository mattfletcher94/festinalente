#!/usr/bin/env node

// Get the next available task ID with slug
// Usage: node next-id.cjs --title="Task title here"
// Returns JSON with nextId (format: {number}-{slug}), currentHighest, padding, and slug

import fs from 'fs';
import slugify from 'slugify';

const TASKS_DIR = '.festinalente/tasks';
const CONFIG_FILE = '.festinalente/config.yaml';
const MAX_SLUG_LENGTH = 50;

interface SimpleYamlResult {
  idPadding?: number;
  [key: string]: string | number | undefined;
}

/**
 * Parse simple YAML config (key: value pairs).
 *
 * @param content - The YAML content to parse.
 * @returns Parsed key-value pairs.
 */
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

/**
 * Parse the --title argument from process.argv.
 *
 * @returns The title string or null if not provided.
 */
function parseTitleArg(): string | null {
  const titleArg = process.argv.find((arg) => arg.startsWith('--title='));
  if (!titleArg) {
    return null;
  }
  return titleArg.slice('--title='.length);
}

/**
 * Extract the numeric prefix from a folder name.
 * Handles both "021" and "021-slug-here" formats.
 *
 * @param folderName - The folder name to parse.
 * @returns The numeric ID or null if not a valid folder.
 */
function extractNumericId(folderName: string): number | null {
  const match = folderName.match(/^(\d+)/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (!isNaN(id)) {
      return id;
    }
  }
  return null;
}

function main(): void {
  // Parse --title argument
  const title = parseTitleArg();
  if (!title) {
    console.log(
      JSON.stringify({
        error: true,
        message: 'Usage: next-id.cjs --title="Task title"',
      })
    );
    process.exit(1);
  }

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

  // Generate slug from title
  const slug = slugify(title, { lower: true, strict: true }).slice(
    0,
    MAX_SLUG_LENGTH
  );

  if (!fs.existsSync(TASKS_DIR)) {
    // No tasks directory yet, start at 001
    const paddedNumber = '1'.padStart(padding, '0');
    const nextId = `${paddedNumber}-${slug}`;
    const result = {
      nextId,
      currentHighest: null,
      padding,
      slug,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Read folder names (each folder name IS the ID)
  const folders = fs
    .readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter((f) => f.isDirectory())
    .map((f) => f.name);

  if (folders.length === 0) {
    const paddedNumber = '1'.padStart(padding, '0');
    const nextId = `${paddedNumber}-${slug}`;
    const result = {
      nextId,
      currentHighest: null,
      padding,
      slug,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Find highest ID (folder names can be "001" or "001-slug-here")
  let highest = 0;

  for (const folderName of folders) {
    const id = extractNumericId(folderName);
    if (id !== null && id > highest) {
      highest = id;
    }
  }

  const paddedNumber = (highest + 1).toString().padStart(padding, '0');
  const nextId = `${paddedNumber}-${slug}`;
  const currentHighest = highest.toString().padStart(padding, '0');

  const result = {
    nextId,
    currentHighest,
    padding,
    slug,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
