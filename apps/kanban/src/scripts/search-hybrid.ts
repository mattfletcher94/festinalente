#!/usr/bin/env node

// Hybrid search combining exact keyword/alias matching with fuzzy search
// Usage: node search-hybrid.cjs keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]
// Returns JSON with combined results and match source attribution
//
// Algorithm:
// 1. Check exact keyword matches (boost +0.3)
// 2. Check exact alias matches (boost +0.25)
// 3. Run Fuse.js fuzzy search on title, tldr, body
// 4. Apply boundary penalty (-0.15 if query matches boundary)
// 5. Combine scores and deduplicate
// 6. Return with source attribution

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';

const PRODUCT_DIR = '.kanban/product';
const ENGINEERING_DIR = '.kanban/engineering';

interface ParsedArgs {
  _: string[];
  'min-score'?: string;
  type?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface Doc {
  id: string;
  title: string;
  type: string;
  tldr: string;
  summary: string;
  keywords: string[];
  aliases: string[];
  boundary: string;
  body: string;
  path: string;
  docType: 'product' | 'engineering';
}

interface MatchSources {
  exactKeyword: boolean;
  exactAlias: boolean;
  fuzzyTitle: number;
  fuzzyTldr: number;
  fuzzyBody: number;
}

interface HybridSearchResult {
  id: string;
  title: string;
  score: number;
  matchSources: MatchSources;
  boundaryPenalty: number;
  path: string;
  docType: 'product' | 'engineering';
  tldr: string;
  summary: string;
}

interface HybridSearchOutput {
  query: string[];
  results: HybridSearchResult[];
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

function scanRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanRecursive(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function deriveId(filePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const withoutExt = relativePath.replace(/\.md$/, '');
  const parts = withoutExt.split('/');

  // Handle systems/*/_index.md -> systems/*
  if (parts[0] === 'systems' && parts.length === 3 && parts[2] === '_index') {
    return `${parts[0]}/${parts[1]}`;
  }

  return withoutExt;
}

function loadDocs(docType: 'product' | 'engineering', dir: string): Doc[] {
  const files = scanRecursive(dir);
  const docs: Doc[] = [];

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);
    const id = deriveId(filePath, dir);

    docs.push({
      id: (frontmatter.id as string) || id,
      title: (frontmatter.title as string) || '',
      type: (frontmatter.type as string) || 'feature',
      tldr: (frontmatter.tldr as string) || '',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords.map((k: string) => k.toLowerCase()) : [],
      aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases.map((a: string) => a.toLowerCase()) : [],
      boundary: (frontmatter.boundary as string) || '',
      body: body.slice(0, 1000),
      path: normalizedPath,
      docType
    });
  }

  return docs;
}

function checkExactMatch(terms: string[], searchTerms: string[]): boolean {
  const lowerSearchTerms = searchTerms.map(t => t.toLowerCase());
  for (const term of terms) {
    if (lowerSearchTerms.includes(term.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function checkBoundaryMatch(boundary: string, searchTerms: string[]): number {
  if (!boundary) return 0;
  const boundaryLower = boundary.toLowerCase();
  for (const term of searchTerms) {
    if (boundaryLower.includes(term.toLowerCase())) {
      return 0.15; // Penalty amount
    }
  }
  return 0;
}

function runFuzzySearch(docs: Doc[], searchTerms: string[]): Map<string, { title: number; tldr: number; body: number }> {
  const results = new Map<string, { title: number; tldr: number; body: number }>();

  // Initialize all docs with 0 scores
  for (const doc of docs) {
    results.set(doc.id, { title: 0, tldr: 0, body: 0 });
  }

  const query = searchTerms.join(' ');

  // Search title
  const fuseTitleConfig = {
    keys: ['title'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true
  };
  const fuseTitle = new Fuse(docs, fuseTitleConfig);
  for (const result of fuseTitle.search(query)) {
    const current = results.get(result.item.id)!;
    current.title = 1 - (result.score || 0);
  }

  // Search tldr
  const fuseTldrConfig = {
    keys: ['tldr'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true
  };
  const fuseTldr = new Fuse(docs, fuseTldrConfig);
  for (const result of fuseTldr.search(query)) {
    const current = results.get(result.item.id)!;
    current.tldr = 1 - (result.score || 0);
  }

  // Search body
  const fuseBodyConfig = {
    keys: ['body'],
    threshold: 0.5, // Looser threshold for body
    includeScore: true,
    ignoreLocation: true
  };
  const fuseBody = new Fuse(docs, fuseBodyConfig);
  for (const result of fuseBody.search(query)) {
    const current = results.get(result.item.id)!;
    current.body = 1 - (result.score || 0);
  }

  return results;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const searchTerms = args._;
  const minScore = args['min-score'] ? parseFloat(args['min-score']) : 0.3;
  const docTypeFilter = args.type as 'product' | 'engineering' | undefined;

  if (searchTerms.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: search-hybrid.cjs keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]'
    }));
    process.exit(1);
  }

  // Load docs based on filter
  let docs: Doc[] = [];

  if (!docTypeFilter || docTypeFilter === 'product') {
    if (fs.existsSync(PRODUCT_DIR)) {
      docs = docs.concat(loadDocs('product', PRODUCT_DIR));
    }
  }

  if (!docTypeFilter || docTypeFilter === 'engineering') {
    if (fs.existsSync(ENGINEERING_DIR)) {
      docs = docs.concat(loadDocs('engineering', ENGINEERING_DIR));
    }
  }

  if (docs.length === 0) {
    const output: HybridSearchOutput = {
      query: searchTerms,
      results: []
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Run fuzzy search
  const fuzzyScores = runFuzzySearch(docs, searchTerms);

  // Calculate combined scores
  const results: HybridSearchResult[] = [];

  for (const doc of docs) {
    const exactKeyword = checkExactMatch(doc.keywords, searchTerms);
    const exactAlias = checkExactMatch(doc.aliases, searchTerms);
    const fuzzy = fuzzyScores.get(doc.id)!;
    const boundaryPenalty = checkBoundaryMatch(doc.boundary, searchTerms);

    // Calculate combined score
    // Exact matches give strong boosts
    // Fuzzy matches contribute based on their individual scores
    let score = 0;

    if (exactKeyword) score += 0.3;
    if (exactAlias) score += 0.25;
    score += fuzzy.title * 0.2;  // Title fuzzy contributes up to 0.2
    score += fuzzy.tldr * 0.15;  // Tldr fuzzy contributes up to 0.15
    score += fuzzy.body * 0.1;   // Body fuzzy contributes up to 0.1

    // Apply boundary penalty
    score = Math.max(0, score - boundaryPenalty);

    // Only include if score meets threshold or has exact matches
    if (score >= minScore || exactKeyword || exactAlias) {
      results.push({
        id: doc.id,
        title: doc.title,
        score: Math.round(score * 100) / 100,
        matchSources: {
          exactKeyword,
          exactAlias,
          fuzzyTitle: Math.round(fuzzy.title * 100) / 100,
          fuzzyTldr: Math.round(fuzzy.tldr * 100) / 100,
          fuzzyBody: Math.round(fuzzy.body * 100) / 100
        },
        boundaryPenalty: Math.round(boundaryPenalty * 100) / 100,
        path: doc.path,
        docType: doc.docType,
        tldr: doc.tldr,
        summary: doc.summary
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const output: HybridSearchOutput = {
    query: searchTerms,
    results
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
