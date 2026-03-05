/**
 * Validation handler - commands for validating XML, YAML, and documentation.
 *
 * @module cli/handlers/validation
 */

import type { CliCommand, CliResult } from '../types';
import type { DocValidationResult, ValidationComputer } from '../computers/validation.computer';
import { error, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { YamlParserComputer } from '../computers/yaml-parser.computer';
import { defineCommand } from '../registry';

const TASKS_DIR = '.festinalente/tasks';
const QUICK_DIR = '.festinalente/quick';
const PRODUCT_DIR = '.festinalente/product';
const ENGINEERING_DIR = '.festinalente/engineering';
const DIRECTIVES_DIR = '.festinalente/directives';

/**
 * XML validation error.
 */
export interface XmlValidationError {
  readonly file: string;
  readonly message: string;
}

/**
 * XML validation result.
 */
export interface XmlValidationResult {
  readonly valid: boolean;
  readonly filesChecked: number;
  readonly errors: readonly XmlValidationError[];
}

/**
 * YAML validation error.
 */
export interface YamlValidationError {
  readonly file: string;
  readonly message: string;
}

/**
 * YAML validation result.
 */
export interface YamlValidationResult {
  readonly valid: boolean;
  readonly errors: readonly YamlValidationError[];
}

/**
 * Directive validation result.
 */
export interface DirectiveValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Broken reference info.
 */
export interface BrokenRef {
  readonly doc: string;
  readonly field: string;
  readonly target: string;
}

/**
 * Documentation quality output.
 */
export interface DocQualityOutput {
  readonly totalDocs: number;
  readonly passing: number;
  readonly warnings: number;
  readonly errors: number;
  readonly results: readonly DocValidationResult[];
  readonly brokenRefs: readonly BrokenRef[];
  readonly orphanDocs: readonly string[];
}

/**
 * Dependencies for validation handler.
 */
export interface ValidationHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
  readonly validation: ValidationComputer;
}

/**
 * Validation handler interface.
 */
export interface ValidationHandler {
  readonly validateXml: (args: string[]) => CliResult<XmlValidationResult>;
  readonly validateYaml: (args: string[]) => CliResult<YamlValidationResult>;
  readonly validateDirective: (args: string[]) => CliResult<DirectiveValidationResult>;
  readonly validateDocs: (args: string[]) => CliResult<DocQualityOutput>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a validation handler.
 *
 * @param deps - The dependencies.
 * @returns A ValidationHandler instance.
 */
export function createValidationHandler(deps: ValidationHandlerDeps): ValidationHandler {
  const { fs, yamlParser, validation } = deps;

  /**
   * Get XML files for a quick task.
   */
  function getXmlFilesForQuick(quickId: string): readonly string[] | null {
    const quickDir = fs.joinPath(QUICK_DIR, quickId);
    if (!fs.exists(quickDir) || !fs.isDirectory(quickDir)) {
      return null;
    }

    const files: string[] = [];
    const quickXml = fs.joinPath(quickDir, 'quick.xml');
    if (fs.exists(quickXml)) {
      files.push(quickXml);
    }
    return files;
  }

  /**
   * Get XML files for a task.
   */
  function getXmlFilesForTask(taskId: string): readonly string[] | null {
    // Check if this is a quick task path (quick/{id})
    if (taskId.startsWith('quick/')) {
      const quickId = taskId.slice('quick/'.length);
      return getXmlFilesForQuick(quickId);
    }

    const taskDir = fs.joinPath(TASKS_DIR, taskId);
    if (!fs.exists(taskDir) || !fs.isDirectory(taskDir)) {
      return null;
    }

    const files: string[] = [];
    const xmlFiles = ['task.xml', 'spec.xml', 'plan.xml'];
    for (const xmlFile of xmlFiles) {
      const filePath = fs.joinPath(taskDir, xmlFile);
      if (fs.exists(filePath)) {
        files.push(filePath);
      }
    }
    return files;
  }

  /**
   * Get all XML files in tasks directory.
   */
  function getAllXmlFiles(): readonly string[] {
    const files: string[] = [];

    if (!fs.exists(TASKS_DIR)) {
      return files;
    }

    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok) return files;

    for (const dir of dirsResult.value) {
      const taskDir = fs.joinPath(TASKS_DIR, dir);
      const xmlFiles = ['task.xml', 'spec.xml', 'plan.xml'];
      for (const xmlFile of xmlFiles) {
        const filePath = fs.joinPath(taskDir, xmlFile);
        if (fs.exists(filePath)) {
          files.push(filePath);
        }
      }
    }

    return files;
  }

  /**
   * Validate XML command.
   */
  function validateXml(args: string[]): CliResult<XmlValidationResult> {
    const parsed = parseArgs(args);
    let files: readonly string[];

    if (parsed.positional.length > 0) {
      const taskId = parsed.positional[0];
      const taskFiles = getXmlFilesForTask(taskId);
      if (taskFiles === null) {
        return error(`Task not found: ${taskId}`);
      }
      files = taskFiles;
    } else {
      files = getAllXmlFiles();
    }

    if (files.length === 0) {
      return success({
        valid: true,
        filesChecked: 0,
        errors: [],
      });
    }

    const errors: XmlValidationError[] = [];

    for (const file of files) {
      const readResult = fs.readFile(file);
      if (!readResult.ok) {
        errors.push({
          file: file.replace(/\\/g, '/'),
          message: readResult.error.message,
        });
        continue;
      }

      const validationResult = validation.validateXml(readResult.value);
      if (!validationResult.valid) {
        for (const errMsg of validationResult.errors) {
          errors.push({
            file: file.replace(/\\/g, '/'),
            message: errMsg,
          });
        }
      }
    }

    return success({
      valid: errors.length === 0,
      filesChecked: files.length,
      errors,
    });
  }

  /**
   * Get all markdown files in tasks directory.
   */
  function getAllTaskMdFiles(): readonly string[] {
    const files: string[] = [];

    if (!fs.exists(TASKS_DIR)) {
      return files;
    }

    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok) return files;

    for (const dir of dirsResult.value) {
      const taskDir = fs.joinPath(TASKS_DIR, dir);
      const mdFiles = ['task.md', 'spec.md', 'plan.md'];
      for (const mdFile of mdFiles) {
        const filePath = fs.joinPath(taskDir, mdFile);
        if (fs.exists(filePath)) {
          files.push(filePath.replace(/\\/g, '/'));
        }
      }
    }

    return files;
  }

  /**
   * Validate YAML command.
   */
  function validateYamlCommand(_args: string[]): CliResult<YamlValidationResult> {
    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found.`);
    }

    const files = getAllTaskMdFiles();
    const errors: YamlValidationError[] = [];

    for (const file of files) {
      const readResult = fs.readFile(file);
      if (!readResult.ok) {
        errors.push({
          file,
          message: readResult.error.message,
        });
        continue;
      }

      try {
        yamlParser.parseFrontmatter(readResult.value);
      } catch (err) {
        errors.push({
          file,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return success({
      valid: errors.length === 0,
      errors,
    });
  }

  /**
   * Validate directive command.
   */
  function validateDirectiveCommand(args: string[]): CliResult<DirectiveValidationResult> {
    const parsed = parseArgs(args);

    if (parsed.positional.length === 0) {
      return error('Usage: validate-directive <directive-name>');
    }

    const directiveName = parsed.positional[0];
    const filePath = fs.joinPath(DIRECTIVES_DIR, `${directiveName}.xml`);

    if (!fs.exists(filePath)) {
      return error(`Directive file not found: ${filePath}`);
    }

    const readResult = fs.readFile(filePath);
    if (!readResult.ok) {
      return error(`Failed to read directive file: ${readResult.error.message}`);
    }

    const result = validation.validateDirective(readResult.value, directiveName);

    return success({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  }

  /**
   * Derive ID from doc path.
   */
  function deriveIdFromPath(docPath: string, baseDir: string): string {
    const relativePath = fs.relativePath(baseDir, docPath).replace(/\\/g, '/');
    let id = relativePath.replace(/\.md$/, '');
    if (id.endsWith('/_index')) {
      id = id.replace(/\/_index$/, '');
    }
    return id;
  }

  /**
   * Validate documentation quality command.
   */
  function validateDocs(args: string[]): CliResult<DocQualityOutput> {
    const parsed = parseArgs(args);
    const typeFilter = getStringFlag(parsed.flags, 'type') as 'product' | 'engineering' | undefined;

    const results: DocValidationResult[] = [];
    const allDocPaths: Array<{ path: string; baseDir: string }> = [];

    // Validate product docs
    if (!typeFilter || typeFilter === 'product') {
      const scanResult = fs.scanRecursive(PRODUCT_DIR, '.md');
      if (scanResult.ok) {
        for (const docPath of scanResult.value) {
          allDocPaths.push({ path: docPath, baseDir: PRODUCT_DIR });
          const readResult = fs.readFile(docPath);
          if (!readResult.ok) continue;

          const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
          const id = deriveIdFromPath(docPath, PRODUCT_DIR);
          const normalizedPath = docPath.replace(/\\/g, '/');

          const result = validation.validateDocQuality(
            frontmatter,
            body,
            id,
            normalizedPath
          );
          results.push(result);
        }
      }
    }

    // Validate engineering docs
    if (!typeFilter || typeFilter === 'engineering') {
      const scanResult = fs.scanRecursive(ENGINEERING_DIR, '.md');
      if (scanResult.ok) {
        for (const docPath of scanResult.value) {
          allDocPaths.push({ path: docPath, baseDir: ENGINEERING_DIR });
          const readResult = fs.readFile(docPath);
          if (!readResult.ok) continue;

          const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
          const id = deriveIdFromPath(docPath, ENGINEERING_DIR);
          const normalizedPath = docPath.replace(/\\/g, '/');

          const result = validation.validateDocQuality(
            frontmatter,
            body,
            id,
            normalizedPath
          );
          results.push(result);
        }
      }
    }

    // Check for broken references and orphan docs
    const allDocIds = new Set(results.map((r) => r.id));
    const brokenRefs: BrokenRef[] = [];
    const referencedIds = new Set<string>();

    for (const { path: docPath, baseDir } of allDocPaths) {
      const readResult = fs.readFile(docPath);
      if (!readResult.ok) continue;

      const { data: fm } = yamlParser.parseFrontmatter(readResult.value);
      const docId = deriveIdFromPath(docPath, baseDir);

      const references = Array.isArray(fm.references) ? fm.references : [];
      const uses = Array.isArray(fm.uses) ? fm.uses : [];

      for (const ref of references) {
        referencedIds.add(ref);
        if (!allDocIds.has(ref)) {
          brokenRefs.push({ doc: docId, field: 'references', target: ref });
        }
      }
      for (const use of uses) {
        referencedIds.add(use);
        if (!allDocIds.has(use)) {
          brokenRefs.push({ doc: docId, field: 'uses', target: use });
        }
      }
    }

    // Find orphan docs (no incoming references, excluding overview docs)
    const orphanDocs: string[] = [];
    for (const id of allDocIds) {
      if (!referencedIds.has(id) && !id.endsWith('overview') && id !== 'overview') {
        orphanDocs.push(id);
      }
    }

    const passing = results.filter((r) => r.status === 'pass').length;
    const warnings = results.filter((r) => r.status === 'warning').length;
    const errorsCount = results.filter((r) => r.status === 'error').length;

    return success({
      totalDocs: results.length,
      passing,
      warnings,
      errors: errorsCount,
      results,
      brokenRefs,
      orphanDocs,
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'validate-xml',
        'Validate XML in task files',
        'validate-xml [taskId]',
        validateXml
      ),
      defineCommand(
        'validate-yaml',
        'Validate YAML frontmatter in task files',
        'validate-yaml',
        validateYamlCommand
      ),
      defineCommand(
        'validate-directive',
        'Validate a directive XML file',
        'validate-directive <directive-name>',
        validateDirectiveCommand
      ),
      defineCommand(
        'validate-docs',
        'Validate documentation quality',
        'validate-docs [--type=product|engineering]',
        validateDocs
      ),
    ];
  }

  return {
    validateXml,
    validateYaml: validateYamlCommand,
    validateDirective: validateDirectiveCommand,
    validateDocs,
    getCommands,
  };
}
