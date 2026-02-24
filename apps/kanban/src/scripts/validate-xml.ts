#!/usr/bin/env node

// Validate XML in task files
// Usage: node validate-xml.cjs [taskId]
// If taskId provided: validates only task.xml, spec.xml, plan.xml in .kanban/tasks/{taskId}/
// If no arguments: validates all XML files in .kanban/tasks/
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

function getXmlFilesForTask(taskId: string): string[] | null {
  const taskDir = path.join(TASKS_DIR, taskId);
  if (!fs.existsSync(taskDir) || !fs.statSync(taskDir).isDirectory()) {
    return null;
  }
  const files: string[] = [];
  const xmlFiles = ['task.xml', 'spec.xml', 'plan.xml'];
  for (const xmlFile of xmlFiles) {
    const filePath = path.join(taskDir, xmlFile);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }
  return files;
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
  const args = process.argv.slice(2);
  let files: string[];

  if (args.length > 0) {
    const taskId = args[0];
    const taskFiles = getXmlFilesForTask(taskId);
    if (taskFiles === null) {
      console.log(JSON.stringify({
        valid: false,
        error: true,
        message: `Task not found: ${taskId}`
      }));
      process.exit(1);
    }
    files = taskFiles;
  } else {
    files = getAllXmlFiles();
  }

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
