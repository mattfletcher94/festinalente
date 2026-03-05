/**
 * Docs handler - commands for listing and checking documentation.
 *
 * @module cli/handlers/docs
 */

import type { CliCommand, CliResult } from '../types';
import { error, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { YamlParserComputer } from '../computers/yaml-parser.computer';
import { defineCommand } from '../registry';

const PRODUCT_DIR = '.festinalente/product';
const ENGINEERING_DIR = '.festinalente/engineering';

/**
 * Product doc info.
 */
export interface ProductDocInfo {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly domain: string | null;
  readonly path: string;
}

/**
 * Engineering doc info.
 */
export interface EngineeringDocInfo {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly system: string | null;
  readonly paths: readonly string[];
  readonly filePath: string;
}

/**
 * List product result.
 */
export interface ListProductResult {
  readonly count: number;
  readonly docs: readonly ProductDocInfo[];
}

/**
 * List engineering result.
 */
export interface ListEngineeringResult {
  readonly count: number;
  readonly docs: readonly EngineeringDocInfo[];
}

/**
 * Check result for a single doc.
 */
export interface CheckDocResult {
  readonly id: string;
  readonly exists: boolean;
  readonly path: string;
}

/**
 * Check summary.
 */
export interface CheckSummary {
  readonly existing: readonly string[];
  readonly missing: readonly string[];
}

/**
 * Check docs output.
 */
export interface CheckDocsOutput {
  readonly results: readonly CheckDocResult[];
  readonly summary: CheckSummary;
}

/**
 * Dependencies for docs handler.
 */
export interface DocsHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
}

/**
 * Docs handler interface.
 */
export interface DocsHandler {
  readonly listProduct: (args: string[]) => CliResult<ListProductResult>;
  readonly listEngineering: (args: string[]) => CliResult<ListEngineeringResult>;
  readonly checkProduct: (args: string[]) => CliResult<CheckDocsOutput>;
  readonly checkEngineering: (args: string[]) => CliResult<CheckDocsOutput>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a docs handler.
 *
 * @param deps - The dependencies.
 * @returns A DocsHandler instance.
 */
export function createDocsHandler(deps: DocsHandlerDeps): DocsHandler {
  const { fs, yamlParser } = deps;

  /**
   * Derive ID and domain from product file path.
   */
  function deriveProductIdAndDomain(filePath: string): { id: string; domain: string | null } {
    const relativePath = fs.relativePath(PRODUCT_DIR, filePath).replace(/\\/g, '/');
    const withoutExt = relativePath.replace(/\.md$/, '');
    const parts = withoutExt.split('/');

    if (parts.length === 1) {
      return { id: parts[0], domain: null };
    }
    return { id: withoutExt, domain: parts[0] };
  }

  /**
   * Derive ID and system from engineering file path.
   */
  function deriveEngineeringIdAndSystem(filePath: string): { id: string; system: string | null } {
    const relativePath = fs.relativePath(ENGINEERING_DIR, filePath).replace(/\\/g, '/');
    const withoutExt = relativePath.replace(/\.md$/, '');
    const parts = withoutExt.split('/');

    if (parts.length === 1) {
      return { id: parts[0], system: null };
    }

    if (parts[0] === 'systems') {
      if (parts.length === 3 && parts[2] === '_index') {
        return { id: `${parts[0]}/${parts[1]}`, system: null };
      } else if (parts.length === 3) {
        return { id: withoutExt, system: parts[1] };
      } else if (parts.length === 2) {
        return { id: withoutExt, system: null };
      }
    }

    return { id: withoutExt, system: null };
  }

  /**
   * Convert engineering doc ID to file path.
   */
  function engineeringIdToPath(id: string): string {
    if (id === 'overview') {
      return fs.joinPath(ENGINEERING_DIR, 'overview.md');
    }

    const parts = id.split('/');

    // Systems have nested structure with _index.md
    if (parts[0] === 'systems' && parts.length === 2) {
      return fs.joinPath(ENGINEERING_DIR, parts[0], parts[1], '_index.md');
    }

    // Everything else: direct mapping
    return fs.joinPath(ENGINEERING_DIR, `${id}.md`);
  }

  /**
   * List product docs command.
   */
  function listProduct(args: string[]): CliResult<ListProductResult> {
    const parsed = parseArgs(args);
    const typeFilter = getStringFlag(parsed.flags, 'type');
    const domainFilter = getStringFlag(parsed.flags, 'domain');

    if (!fs.exists(PRODUCT_DIR)) {
      return error(`${PRODUCT_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const scanResult = fs.scanRecursive(PRODUCT_DIR, '.md');
    if (!scanResult.ok) {
      return error(`Failed to scan product directory: ${scanResult.error.message}`);
    }

    const files = [...scanResult.value].sort();
    const docs: ProductDocInfo[] = [];

    for (const filePath of files) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const readResult = fs.readFile(filePath);
      if (!readResult.ok) continue;

      const { data: frontmatter } = yamlParser.parseFrontmatter(readResult.value);
      const { id, domain } = deriveProductIdAndDomain(filePath);

      const doc: ProductDocInfo = {
        id: (frontmatter.id as string) || id,
        title: (frontmatter.title as string) || '',
        type: (frontmatter.type as string) || 'feature',
        summary: (frontmatter.summary as string) || '',
        keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
        domain,
        path: normalizedPath,
      };

      // Apply filters
      if (typeFilter && doc.type !== typeFilter) continue;
      if (domainFilter && doc.domain !== domainFilter) continue;

      docs.push(doc);
    }

    return success({
      count: docs.length,
      docs,
    });
  }

  /**
   * List engineering docs command.
   */
  function listEngineering(args: string[]): CliResult<ListEngineeringResult> {
    const parsed = parseArgs(args);
    const typeFilter = getStringFlag(parsed.flags, 'type');
    const systemFilter = getStringFlag(parsed.flags, 'system');

    if (!fs.exists(ENGINEERING_DIR)) {
      return error(`${ENGINEERING_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const scanResult = fs.scanRecursive(ENGINEERING_DIR, '.md');
    if (!scanResult.ok) {
      return error(`Failed to scan engineering directory: ${scanResult.error.message}`);
    }

    const files = [...scanResult.value].sort();
    const docs: EngineeringDocInfo[] = [];

    for (const filePath of files) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const readResult = fs.readFile(filePath);
      if (!readResult.ok) continue;

      const { data: frontmatter } = yamlParser.parseFrontmatter(readResult.value);
      const { id, system } = deriveEngineeringIdAndSystem(filePath);

      const doc: EngineeringDocInfo = {
        id: (frontmatter.id as string) || id,
        title: (frontmatter.title as string) || '',
        type: (frontmatter.type as string) || 'pattern',
        summary: (frontmatter.summary as string) || '',
        keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
        system,
        paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
        filePath: normalizedPath,
      };

      // Apply filters
      if (typeFilter && doc.type !== typeFilter) continue;
      if (systemFilter && doc.system !== systemFilter) continue;

      docs.push(doc);
    }

    return success({
      count: docs.length,
      docs,
    });
  }

  /**
   * Check product docs command.
   */
  function checkProduct(args: string[]): CliResult<CheckDocsOutput> {
    const parsed = parseArgs(args);
    const ids = parsed.positional;

    if (ids.length === 0) {
      return error('Usage: check-product id1 id2 ... (e.g., auth/login auth/mfa)');
    }

    const results: CheckDocResult[] = [];
    const existing: string[] = [];
    const missing: string[] = [];

    for (const id of ids) {
      const docPath = fs.joinPath(PRODUCT_DIR, `${id}.md`).replace(/\\/g, '/');
      const exists = fs.exists(docPath);

      results.push({
        id,
        exists,
        path: docPath,
      });

      if (exists) {
        existing.push(id);
      } else {
        missing.push(id);
      }
    }

    return success({
      results,
      summary: {
        existing,
        missing,
      },
    });
  }

  /**
   * Check engineering docs command.
   */
  function checkEngineering(args: string[]): CliResult<CheckDocsOutput> {
    const parsed = parseArgs(args);
    const ids = parsed.positional;

    if (ids.length === 0) {
      return error('Usage: check-engineering id1 id2 ... (e.g., systems/auth patterns/middleware)');
    }

    const results: CheckDocResult[] = [];
    const existing: string[] = [];
    const missing: string[] = [];

    for (const id of ids) {
      const docPath = engineeringIdToPath(id).replace(/\\/g, '/');
      const exists = fs.exists(docPath);

      results.push({
        id,
        exists,
        path: docPath,
      });

      if (exists) {
        existing.push(id);
      } else {
        missing.push(id);
      }
    }

    return success({
      results,
      summary: {
        existing,
        missing,
      },
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'list-product',
        'List all product docs with optional filtering',
        'list-product [--type=X] [--domain=X]',
        listProduct
      ),
      defineCommand(
        'list-engineering',
        'List all engineering docs with optional filtering',
        'list-engineering [--type=X] [--system=X]',
        listEngineering
      ),
      defineCommand(
        'check-product',
        'Check if product docs exist by ID',
        'check-product id1 id2 ...',
        checkProduct
      ),
      defineCommand(
        'check-engineering',
        'Check if engineering docs exist by ID',
        'check-engineering id1 id2 ...',
        checkEngineering
      ),
    ];
  }

  return {
    listProduct,
    listEngineering,
    checkProduct,
    checkEngineering,
    getCommands,
  };
}
