#!/usr/bin/env node

// Smart context selection for task implementation
// Usage: node select-context.cjs <task-id> [--tier=minimal|standard|full] [--max=5]
// Returns JSON with selected docs and their content at appropriate tier
//
// Tiers:
// - minimal: Only tldr field (~50 tokens per doc)
// - standard: tldr + summary + boundary (~200 tokens per doc)
// - full: Entire doc content (~500-1000 tokens per doc)

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TASKS_DIR = '.kanban/tasks';
const PRODUCT_DIR = '.kanban/product';
const ENGINEERING_DIR = '.kanban/engineering';

interface ParsedArgs {
  _: string[];
  tier?: string;
  max?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface DocContent {
  id: string;
  type: 'product' | 'engineering';
  relevanceScore: number;
  content: string;
  tldr: string;
  summary: string;
  boundary: string;
}

interface SelectContextOutput {
  taskId: string;
  tier: string;
  docs: DocContent[];
  totalTokensEstimate: number;
}

interface TaskXml {
  title: string;
  description: string;
  affects: string[];
  engineering: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [] };

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

function findTaskFile(taskId: string): string | null {
  const taskDir = path.join(TASKS_DIR, taskId);
  const taskFile = path.join(taskDir, 'task.xml');

  if (fs.existsSync(taskFile)) {
    return taskFile;
  }

  // Search for padded ID
  if (fs.existsSync(TASKS_DIR)) {
    const entries = fs.readdirSync(TASKS_DIR);
    for (const entry of entries) {
      if (entry.endsWith(taskId) || entry === taskId) {
        const possibleFile = path.join(TASKS_DIR, entry, 'task.xml');
        if (fs.existsSync(possibleFile)) {
          return possibleFile;
        }
      }
    }
  }

  return null;
}

function parseTaskXml(content: string): TaskXml {
  // Simple XML parsing for task elements
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
  const descMatch = content.match(/<description>([\s\S]*?)<\/description>/);
  const affectsMatch = content.match(/<affects>([\s\S]*?)<\/affects>/);
  const engineeringMatch = content.match(/<engineering>([\s\S]*?)<\/engineering>/);

  const parseIds = (text: string | undefined): string[] => {
    if (!text) return [];
    // Match ref elements or plain text IDs
    const refMatches = text.match(/<ref[^>]*>([^<]*)<\/ref>/g) || [];
    const ids = refMatches.map(r => {
      const idMatch = r.match(/>([^<]*)</);
      return idMatch ? idMatch[1].trim() : '';
    }).filter(Boolean);

    // Also try plain text IDs (comma or newline separated)
    if (ids.length === 0) {
      return text.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    }
    return ids;
  };

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    affects: parseIds(affectsMatch?.[1]),
    engineering: parseIds(engineeringMatch?.[1])
  };
}

function readDoc(docPath: string, docType: 'product' | 'engineering'): DocContent | null {
  if (!fs.existsSync(docPath)) return null;

  try {
    const content = fs.readFileSync(docPath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    return {
      id: (frontmatter.id as string) || path.basename(docPath, '.md'),
      type: docType,
      relevanceScore: 1.0, // Will be adjusted based on task relationship
      content: body,
      tldr: (frontmatter.tldr as string) || '',
      summary: (frontmatter.summary as string) || '',
      boundary: (frontmatter.boundary as string) || ''
    };
  } catch {
    return null;
  }
}

function resolveDocPath(id: string, baseDir: string): string {
  // Try direct path first
  let docPath = path.join(baseDir, `${id}.md`);
  if (fs.existsSync(docPath)) return docPath;

  // Try with _index.md for systems
  if (baseDir === ENGINEERING_DIR && id.startsWith('systems/')) {
    docPath = path.join(baseDir, id, '_index.md');
    if (fs.existsSync(docPath)) return docPath;
  }

  // Try adding .md extension
  docPath = path.join(baseDir, id);
  if (!docPath.endsWith('.md')) {
    docPath += '.md';
  }

  return docPath;
}

function getTieredContent(doc: DocContent, tier: string): string {
  switch (tier) {
    case 'minimal':
      // Only tldr (~50 tokens)
      return doc.tldr || doc.summary?.split('.')[0] || '';

    case 'standard':
      // tldr + summary + boundary (~200 tokens)
      const parts: string[] = [];
      if (doc.tldr) parts.push(`**TL;DR:** ${doc.tldr}`);
      if (doc.summary) parts.push(`**Summary:** ${doc.summary}`);
      if (doc.boundary) parts.push(`**Boundaries:** ${doc.boundary}`);
      return parts.join('\n\n');

    case 'full':
    default:
      // Full content (~500-1000 tokens)
      return doc.content;
  }
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const taskId = args._[0];
  const tier = (args.tier as string) || 'standard';
  const maxDocs = args.max ? parseInt(args.max as string, 10) : 5;

  if (!taskId) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: select-context.cjs <task-id> [--tier=minimal|standard|full] [--max=5]'
    }));
    process.exit(1);
  }

  // Find and read task file
  const taskFile = findTaskFile(taskId);
  if (!taskFile) {
    console.log(JSON.stringify({
      error: true,
      message: `Task ${taskId} not found`
    }));
    process.exit(1);
  }

  const taskContent = fs.readFileSync(taskFile, 'utf8');
  const task = parseTaskXml(taskContent);

  // Collect docs from affects and engineering fields
  const docs: DocContent[] = [];
  const seenIds = new Set<string>();

  // Add product docs from affects
  for (const id of task.affects) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const docPath = resolveDocPath(id, PRODUCT_DIR);
    const doc = readDoc(docPath, 'product');
    if (doc) {
      doc.relevanceScore = 1.0; // Explicitly linked = highest relevance
      docs.push(doc);
    }
  }

  // Add engineering docs from engineering field
  for (const id of task.engineering) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const docPath = resolveDocPath(id, ENGINEERING_DIR);
    const doc = readDoc(docPath, 'engineering');
    if (doc) {
      doc.relevanceScore = 1.0; // Explicitly linked = highest relevance
      docs.push(doc);
    }
  }

  // Sort by relevance and limit
  docs.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const selectedDocs = docs.slice(0, maxDocs);

  // Apply tier content
  const tieredDocs = selectedDocs.map(doc => ({
    ...doc,
    content: getTieredContent(doc, tier)
  }));

  // Calculate token estimate
  const totalTokens = tieredDocs.reduce(
    (sum, doc) => sum + estimateTokens(doc.content),
    0
  );

  const output: SelectContextOutput = {
    taskId,
    tier,
    docs: tieredDocs,
    totalTokensEstimate: totalTokens
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
