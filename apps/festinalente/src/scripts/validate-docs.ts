#!/usr/bin/env node

// Validate documentation quality
// Usage: node validate-docs.cjs [--type=product|engineering]
// Returns JSON with quality report
//
// Quality checks:
// - has-tldr: tldr field exists and has >10 chars
// - has-summary: summary field exists and has >50 chars
// - has-keywords: keywords array has >=2 items
// - has-overview: body contains "## Overview"
// - has-examples: body contains code blocks
// - has-boundaries: boundary field exists or body contains "## Boundaries"
// - not-too-short: body has >300 chars
// - not-too-long: body has <5000 chars

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PRODUCT_DIR = '.festinalente/product';
const ENGINEERING_DIR = '.festinalente/engineering';

interface ParsedArgs {
  _: string[];
  type?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface CheckResult {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message?: string;
}

interface DocResult {
  id: string;
  path: string;
  status: 'pass' | 'warning' | 'error';
  checks: CheckResult[];
}

interface QualityOutput {
  totalDocs: number;
  passing: number;
  warnings: number;
  errors: number;
  results: DocResult[];
}

interface QualityCheck {
  name: string;
  check: (frontmatter: Record<string, unknown>, body: string) => boolean;
  severity: 'error' | 'warning';
  message: string;
}

const checks: QualityCheck[] = [
  {
    name: 'has-tldr',
    check: (fm) => typeof fm.tldr === 'string' && fm.tldr.length > 10,
    severity: 'error',
    message: 'Missing or too short tldr (need >10 chars)'
  },
  {
    name: 'has-summary',
    check: (fm) => typeof fm.summary === 'string' && fm.summary.length > 50,
    severity: 'error',
    message: 'Missing or too short summary (need >50 chars)'
  },
  {
    name: 'has-keywords',
    check: (fm) => Array.isArray(fm.keywords) && fm.keywords.length >= 2,
    severity: 'warning',
    message: 'Need at least 2 keywords for search'
  },
  {
    name: 'has-overview',
    check: (_, body) => body.includes('## Overview') || body.includes('## What is this'),
    severity: 'error',
    message: 'Missing Overview section'
  },
  {
    name: 'has-examples',
    check: (_, body) => body.includes('```') || body.includes('## Examples'),
    severity: 'warning',
    message: 'No code examples found'
  },
  {
    name: 'has-boundaries',
    check: (fm, body) => (typeof fm.boundary === 'string' && fm.boundary.length > 0) ||
      body.includes('## Boundaries') || body.includes('Does NOT'),
    severity: 'warning',
    message: 'No boundaries defined (helps prevent false positives in search)'
  },
  {
    name: 'not-too-short',
    check: (_, body) => body.length > 300,
    severity: 'warning',
    message: 'Content too short (<300 chars) - may lack detail'
  },
  {
    name: 'not-too-long',
    check: (_, body) => body.length < 5000,
    severity: 'warning',
    message: 'Content too long (>5000 chars) - consider splitting'
  }
];

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

function validateDoc(docPath: string, baseDir: string): DocResult {
  const content = fs.readFileSync(docPath, 'utf8');
  const { data: frontmatter, content: body } = matter(content);

  const relativePath = path.relative(baseDir, docPath).replace(/\\/g, '/');
  let id = relativePath.replace(/\.md$/, '');
  if (id.endsWith('/index')) {
    id = id.replace(/\/index$/, '');
  }

  const checkResults: CheckResult[] = [];
  let hasError = false;
  let hasWarning = false;

  for (const check of checks) {
    const passed = check.check(frontmatter as Record<string, unknown>, body);
    checkResults.push({
      name: check.name,
      passed,
      severity: check.severity,
      message: passed ? undefined : check.message
    });

    if (!passed) {
      if (check.severity === 'error') hasError = true;
      else hasWarning = true;
    }
  }

  return {
    id,
    path: docPath.replace(/\\/g, '/'),
    status: hasError ? 'error' : hasWarning ? 'warning' : 'pass',
    checks: checkResults
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const typeFilter = args.type as string | undefined;

  const results: DocResult[] = [];

  // Validate product docs
  if (!typeFilter || typeFilter === 'product') {
    for (const docPath of scanRecursive(PRODUCT_DIR)) {
      results.push(validateDoc(docPath, PRODUCT_DIR));
    }
  }

  // Validate engineering docs
  if (!typeFilter || typeFilter === 'engineering') {
    for (const docPath of scanRecursive(ENGINEERING_DIR)) {
      results.push(validateDoc(docPath, ENGINEERING_DIR));
    }
  }

  const passing = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  const output: QualityOutput = {
    totalDocs: results.length,
    passing,
    warnings,
    errors,
    results
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
