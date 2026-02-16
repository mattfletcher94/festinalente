#!/usr/bin/env node

/**
 * Build script for Claude Kanban
 *
 * Compiles Handlebars templates from src/content to dist/
 * - skills/*.md files are compiled with partials
 * - kanban-templates/* are copied as-is
 * - kanban-workflow.yaml is copied as-is
 */

import Handlebars from 'handlebars';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up from dist/tools to project root
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SRC_CONTENT = path.join(PROJECT_ROOT, 'src/content');
const DIST = path.join(PROJECT_ROOT, 'dist');

// Normalize paths for glob (use forward slashes)
function toGlobPath(p: string): string {
  return p.replace(/\\/g, '/');
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function registerPartials(): Promise<void> {
  const partialsDir = path.join(SRC_CONTENT, 'partials');
  const globPattern = toGlobPath(path.join(partialsDir, '*.md'));

  try {
    const partialFiles = await glob(globPattern);

    for (const file of partialFiles) {
      const name = path.basename(file, '.md');
      const content = await fs.readFile(file, 'utf-8');
      Handlebars.registerPartial(name, content);
      console.log(`  Registered partial: ${name}`);
    }

    if (partialFiles.length === 0) {
      console.log('  No partials found (this is OK for initial build)');
    }
  } catch (error) {
    // Partials directory might not exist yet
    console.log('  No partials directory found (this is OK for initial build)');
  }
}

async function compileFile(srcFile: string, distFile: string): Promise<void> {
  const content = await fs.readFile(srcFile, 'utf-8');

  // Check if file contains Handlebars syntax
  if (content.includes('{{')) {
    try {
      const template = Handlebars.compile(content, { strict: false });
      const output = template({});
      await ensureDir(path.dirname(distFile));
      await fs.writeFile(distFile, output);
    } catch (error) {
      console.error(`  Error compiling ${srcFile}:`, error);
      // Fall back to copying the file as-is
      await ensureDir(path.dirname(distFile));
      await fs.copyFile(srcFile, distFile);
    }
  } else {
    // No Handlebars syntax, just copy
    await ensureDir(path.dirname(distFile));
    await fs.copyFile(srcFile, distFile);
  }
}

async function compileDirectory(dir: string): Promise<number> {
  const srcDir = path.join(SRC_CONTENT, dir);
  const globPattern = toGlobPath(path.join(srcDir, '**/*.md'));
  const files = await glob(globPattern);

  let count = 0;
  for (const srcFile of files) {
    const relativePath = path.relative(SRC_CONTENT, srcFile);
    const distFile = path.join(DIST, relativePath);
    await compileFile(srcFile, distFile);
    count++;
  }

  return count;
}

async function copyDirectory(srcDirName: string, destDirName?: string): Promise<number> {
  const srcDir = path.join(SRC_CONTENT, srcDirName);
  const globPattern = toGlobPath(path.join(srcDir, '**/*'));
  const files = await glob(globPattern, { nodir: true });

  const outputDirName = destDirName || srcDirName;
  let count = 0;
  for (const srcFile of files) {
    const relativePath = path.relative(srcDir, srcFile);
    const distFile = path.join(DIST, outputDirName, relativePath);
    await ensureDir(path.dirname(distFile));
    await fs.copyFile(srcFile, distFile);
    count++;
  }

  return count;
}

async function copyFile(srcFile: string, distFile: string): Promise<void> {
  await ensureDir(path.dirname(distFile));
  await fs.copyFile(srcFile, distFile);
}

async function main(): Promise<void> {
  console.log('Building Claude Kanban...');
  console.log(`  Source: ${SRC_CONTENT}`);
  console.log(`  Output: ${DIST}\n`);

  // Register partials first
  console.log('1. Registering partials...');
  await registerPartials();

  // Compile skills
  console.log('\n2. Compiling skills...');
  const skillCount = await compileDirectory('skills');
  console.log(`  Compiled ${skillCount} skill files`);

  // Copy kanban-templates to templates/
  console.log('\n3. Copying templates...');
  const templateCount = await copyDirectory('kanban-templates', 'templates');
  console.log(`  Copied ${templateCount} template files`);

  // Copy kanban-workflow.yaml to workflow.yaml
  console.log('\n4. Copying workflow.yaml...');
  await copyFile(
    path.join(SRC_CONTENT, 'kanban-workflow.yaml'),
    path.join(DIST, 'workflow.yaml')
  );
  console.log('  Copied workflow.yaml');

  console.log('\n✓ Build complete!');
}

main().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
