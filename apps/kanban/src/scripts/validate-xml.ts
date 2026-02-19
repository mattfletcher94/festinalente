#!/usr/bin/env node

// Validate XML in task files
// Usage: node validate-xml.cjs
// Checks for XML parsing errors in task.xml, spec.xml, plan.xml

import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const TASKS_DIR = '.kanban/tasks';

interface ValidationError {
  file: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  filesChecked: number;
  errors: ValidationError[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true
});

function validateFile(filePath: string): ValidationError | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    parser.parse(content);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      file: filePath.replace(/\\/g, '/'),
      message
    };
  }
}

function getAllXmlFiles(): string[] {
  const files: string[] = [];

  if (!fs.existsSync(TASKS_DIR)) {
    return files;
  }

  const taskDirs = fs.readdirSync(TASKS_DIR);

  for (const dir of taskDirs) {
    const taskDir = path.join(TASKS_DIR, dir);
    if (!fs.statSync(taskDir).isDirectory()) continue;

    const xmlFiles = ['task.xml', 'spec.xml', 'plan.xml'];
    for (const xmlFile of xmlFiles) {
      const filePath = path.join(taskDir, xmlFile);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }
  }

  return files;
}

function main(): void {
  const files = getAllXmlFiles();

  if (files.length === 0) {
    console.log(JSON.stringify({
      valid: true,
      filesChecked: 0,
      errors: [],
      message: 'No XML files found in tasks directory'
    }));
    return;
  }

  const result: ValidationResult = {
    valid: true,
    filesChecked: files.length,
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
