#!/usr/bin/env node

// Validate YAML frontmatter in task files
// Usage: node validate-yaml.cjs
// Checks for YAML parsing errors (duplicate keys, syntax errors, etc.)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TASKS_DIR = '.kanban/tasks';

interface ValidationError {
  file: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single markdown file.
 */
function validateFile(filePath: string): ValidationError | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    matter(content); // Will throw on YAML errors
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      file: filePath,
      message
    };
  }
}

/**
 * Get all markdown files in the tasks directory.
 */
function getAllTaskFiles(): string[] {
  const files: string[] = [];

  if (!fs.existsSync(TASKS_DIR)) {
    return files;
  }

  const taskDirs = fs.readdirSync(TASKS_DIR);

  for (const dir of taskDirs) {
    const taskDir = path.join(TASKS_DIR, dir);
    if (!fs.statSync(taskDir).isDirectory()) continue;

    const mdFiles = ['task.md', 'spec.md', 'plan.md'];
    for (const mdFile of mdFiles) {
      const filePath = path.join(taskDir, mdFile);
      if (fs.existsSync(filePath)) {
        files.push(filePath.replace(/\\/g, '/'));
      }
    }
  }

  return files;
}

function main(): void {
  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found.`
    }));
    process.exit(1);
  }

  const files = getAllTaskFiles();
  const result: ValidationResult = {
    valid: true,
    errors: []
  };

  for (const file of files) {
    const error = validateFile(file);
    if (error) {
      result.errors.push(error);
    }
  }

  result.valid = result.errors.length === 0;

  console.log(JSON.stringify(result, null, 2));

  if (!result.valid) {
    process.exit(1);
  }
}

main();
