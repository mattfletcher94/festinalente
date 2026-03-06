/**
 * Query handler - commands for context selection.
 *
 * @module cli/handlers/query
 */

import type { CliCommand, CliResult } from '../types';
import { error, getNumberFlag, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import type { YamlParserComputer } from '../computers/yaml-parser.computer';
import { defineCommand } from '../registry';

const TASKS_DIR = '.festinalente/tasks';
const PRODUCT_DIR = '.festinalente/product';
const ENGINEERING_DIR = '.festinalente/engineering';

/**
 * Doc content for context selection.
 */
export interface DocContent {
  readonly id: string;
  readonly type: 'product' | 'engineering';
  readonly relevanceScore: number;
  readonly content: string;
  readonly tldr: string;
  readonly summary: string;
  readonly boundary: string;
}

/**
 * Select context output.
 */
export interface SelectContextOutput {
  readonly taskId: string;
  readonly tier: string;
  readonly docs: readonly DocContent[];
  readonly totalTokensEstimate: number;
}

/**
 * Dependencies for query handler.
 */
export interface QueryHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
  readonly xmlParser: XmlParserComputer;
}

/**
 * Query handler interface.
 */
export interface QueryHandler {
  readonly selectContext: (args: string[]) => CliResult<SelectContextOutput>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a query handler.
 *
 * @param deps - The dependencies.
 * @returns A QueryHandler instance.
 */
export function createQueryHandler(deps: QueryHandlerDeps): QueryHandler {
  const { fs, yamlParser, xmlParser } = deps;

  /**
   * Find task file by ID.
   */
  function findTaskFile(taskId: string): string | null {
    const taskDir = fs.joinPath(TASKS_DIR, taskId);
    const taskFile = fs.joinPath(taskDir, 'task.xml');

    if (fs.exists(taskFile)) {
      return taskFile;
    }

    // Search for padded ID
    if (fs.exists(TASKS_DIR)) {
      const dirsResult = fs.listDirectories(TASKS_DIR);
      if (dirsResult.ok) {
        for (const entry of dirsResult.value) {
          if (entry.endsWith(taskId) || entry === taskId) {
            const possibleFile = fs.joinPath(TASKS_DIR, entry, 'task.xml');
            if (fs.exists(possibleFile)) {
              return possibleFile;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Resolve doc path from ID.
   */
  function resolveDocPath(id: string, baseDir: string): string {
    // Try direct path first
    let docPath = fs.joinPath(baseDir, `${id}.md`);
    if (fs.exists(docPath)) return docPath;

    // Try with _index.md for systems
    if (baseDir === ENGINEERING_DIR && id.startsWith('systems/')) {
      docPath = fs.joinPath(baseDir, id, '_index.md');
      if (fs.exists(docPath)) return docPath;
    }

    // Try adding .md extension
    docPath = fs.joinPath(baseDir, id);
    if (!docPath.endsWith('.md')) {
      docPath += '.md';
    }

    return docPath;
  }

  /**
   * Read doc from path.
   */
  function readDoc(docPath: string, docType: 'product' | 'engineering'): DocContent | null {
    if (!fs.exists(docPath)) return null;

    const readResult = fs.readFile(docPath);
    if (!readResult.ok) return null;

    try {
      const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);

      return {
        id: (frontmatter.id as string) || fs.basename(docPath, '.md'),
        type: docType,
        relevanceScore: 1.0,
        content: body,
        tldr: (frontmatter.tldr as string) || '',
        summary: (frontmatter.summary as string) || '',
        boundary: (frontmatter.boundary as string) || ''
      };
    } catch {
      return null;
    }
  }

  /**
   * Get tiered content based on tier level.
   */
  function getTieredContent(doc: DocContent, tier: string): string {
    switch (tier) {
      case 'minimal':
        // Only tldr (~50 tokens)
        return doc.tldr || doc.summary?.split('.')[0] || '';

      case 'standard': {
        // tldr + summary + boundary (~200 tokens)
        const parts: string[] = [];
        if (doc.tldr) parts.push(`**TL;DR:** ${doc.tldr}`);
        if (doc.summary) parts.push(`**Summary:** ${doc.summary}`);
        if (doc.boundary) parts.push(`**Boundaries:** ${doc.boundary}`);
        return parts.join('\n\n');
      }

      case 'full':
      default:
        // Full content (~500-1000 tokens)
        return doc.content;
    }
  }

  /**
   * Estimate tokens from text.
   */
  function estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Select context command.
   */
  function selectContext(args: string[]): CliResult<SelectContextOutput> {
    const parsed = parseArgs(args);
    const taskId = parsed.positional[0];
    const tier = getStringFlag(parsed.flags, 'tier') || 'standard';
    const maxDocs = getNumberFlag(parsed.flags, 'max') ?? 5;

    if (!taskId) {
      return error('Usage: select-context <task-id> [--tier=minimal|standard|full] [--max=5]');
    }

    // Find and read task file
    const taskFile = findTaskFile(taskId);
    if (!taskFile) {
      return error(`Task ${taskId} not found`);
    }

    const readResult = fs.readFile(taskFile);
    if (!readResult.ok) {
      return error(`Failed to read task file: ${readResult.error.message}`);
    }

    const task = xmlParser.parseTaskXml(readResult.value);

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
        docs.push({ ...doc, relevanceScore: 1.0 });
      }
    }

    // Add engineering docs from engineering field
    for (const id of task.engineering) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const docPath = resolveDocPath(id, ENGINEERING_DIR);
      const doc = readDoc(docPath, 'engineering');
      if (doc) {
        docs.push({ ...doc, relevanceScore: 1.0 });
      }
    }

    // Sort by relevance and limit
    docs.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const selectedDocs = docs.slice(0, maxDocs);

    // Apply tier content
    const tieredDocs = selectedDocs.map((doc) => ({
      ...doc,
      content: getTieredContent(doc, tier)
    }));

    // Calculate token estimate
    const totalTokens = tieredDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0);

    return success({
      taskId,
      tier,
      docs: tieredDocs,
      totalTokensEstimate: totalTokens
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'select-context',
        'Smart context selection for task implementation',
        'select-context <task-id> [--tier=minimal|standard|full] [--max=5]',
        selectContext
      )
    ];
  }

  return {
    selectContext,
    getCommands
  };
}
