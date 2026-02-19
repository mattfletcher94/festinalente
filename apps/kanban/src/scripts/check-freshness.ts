#!/usr/bin/env node

// Check freshness of documentation based on verified date and code_refs
// Usage: node check-freshness.cjs [--stale-days=30] [--type=product|engineering]
// Returns JSON with freshness report
//
// A doc is stale if:
// - It has a verified date older than stale-days, AND
// - Any of its code_refs have been modified since the verified date

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

const PRODUCT_DIR = '.kanban/product';
const ENGINEERING_DIR = '.kanban/engineering';

interface ParsedArgs {
  _: string[];
  'stale-days'?: string;
  type?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface StaleDoc {
  id: string;
  path: string;
  verifiedDate: string;
  codeRefs: string[];
  modifiedCodeRefs: string[];
  daysSinceVerified: number;
}

interface FreshnessOutput {
  totalDocs: number;
  fresh: number;
  stale: number;
  noVerification: number;
  staleDocs: StaleDoc[];
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

function getGitLastModified(filePath: string): Date | null {
  try {
    // Get the last commit date for the file
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (result) {
      return new Date(result);
    }
  } catch {
    // File might not be tracked by git
  }

  // Fall back to file system modification time
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}

function checkDocFreshness(docPath: string, staleDays: number): {
  isStale: boolean;
  verifiedDate: string | null;
  codeRefs: string[];
  modifiedCodeRefs: string[];
  daysSinceVerified: number;
} {
  const content = fs.readFileSync(docPath, 'utf8');
  const { data: frontmatter } = matter(content);

  const verified = frontmatter.verified as string | undefined;
  const codeRefs = (frontmatter.code_refs as string[]) || [];

  if (!verified) {
    return {
      isStale: false,
      verifiedDate: null,
      codeRefs,
      modifiedCodeRefs: [],
      daysSinceVerified: -1
    };
  }

  const verifiedDate = new Date(verified);
  const now = new Date();
  const daysSince = daysBetween(verifiedDate, now);

  // If within stale threshold, it's fresh
  if (daysSince < staleDays) {
    return {
      isStale: false,
      verifiedDate: verified,
      codeRefs,
      modifiedCodeRefs: [],
      daysSinceVerified: daysSince
    };
  }

  // Check if any code_refs have been modified since verified date
  const modifiedRefs: string[] = [];

  for (const ref of codeRefs) {
    if (fs.existsSync(ref)) {
      const lastModified = getGitLastModified(ref);
      if (lastModified && lastModified > verifiedDate) {
        modifiedRefs.push(ref);
      }
    }
  }

  return {
    isStale: modifiedRefs.length > 0,
    verifiedDate: verified,
    codeRefs,
    modifiedCodeRefs: modifiedRefs,
    daysSinceVerified: daysSince
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const staleDays = args['stale-days'] ? parseInt(args['stale-days'] as string, 10) : 30;
  const typeFilter = args.type as string | undefined;

  const docsToCheck: { path: string; id: string }[] = [];

  // Collect docs based on type filter
  if (!typeFilter || typeFilter === 'product') {
    for (const docPath of scanRecursive(PRODUCT_DIR)) {
      const relativePath = path.relative(PRODUCT_DIR, docPath).replace(/\\/g, '/');
      const id = relativePath.replace(/\.md$/, '');
      docsToCheck.push({ path: docPath, id });
    }
  }

  if (!typeFilter || typeFilter === 'engineering') {
    for (const docPath of scanRecursive(ENGINEERING_DIR)) {
      const relativePath = path.relative(ENGINEERING_DIR, docPath).replace(/\\/g, '/');
      let id = relativePath.replace(/\.md$/, '');
      // Handle index.md files
      if (id.endsWith('/index')) {
        id = id.replace(/\/index$/, '');
      }
      docsToCheck.push({ path: docPath, id });
    }
  }

  const staleDocs: StaleDoc[] = [];
  let freshCount = 0;
  let noVerificationCount = 0;

  for (const { path: docPath, id } of docsToCheck) {
    const result = checkDocFreshness(docPath, staleDays);

    if (result.verifiedDate === null) {
      noVerificationCount++;
    } else if (result.isStale) {
      staleDocs.push({
        id,
        path: docPath.replace(/\\/g, '/'),
        verifiedDate: result.verifiedDate,
        codeRefs: result.codeRefs,
        modifiedCodeRefs: result.modifiedCodeRefs,
        daysSinceVerified: result.daysSinceVerified
      });
    } else {
      freshCount++;
    }
  }

  const output: FreshnessOutput = {
    totalDocs: docsToCheck.length,
    fresh: freshCount,
    stale: staleDocs.length,
    noVerification: noVerificationCount,
    staleDocs
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
