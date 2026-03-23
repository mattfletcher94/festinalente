/**
 * CLI module exports.
 *
 * @module cli
 */

// Types
export type {
  TaskId,
  QuickId,
  DocId,
  SuccessResult,
  ErrorResult,
  CliResult,
  CommandHandler,
  CliCommand,
  ParsedArgs
} from './types';

export {
  createTaskId,
  createQuickId,
  createDocId,
  success,
  error,
  isError,
  isSuccess,
  parseArgs,
  getStringFlag,
  getBoolFlag,
  getNumberFlag
} from './types';

// Registry
export type { CommandRegistry } from './registry';
export { createCommandRegistry, defineCommand, executeCommand } from './registry';

// Capabilities
export type { FileSystemCapability, Result, DirEntry } from './capabilities/file-system.capability';
export { createFileSystemCapability, ok, err } from './capabilities/file-system.capability';

// Computers
export type {
  XmlParserComputer,
  ParsedTask,
  ParsedSpec,
  ParsedPlan,
  ParsedQuick
} from './computers/xml-parser.computer';
export { createXmlParserComputer } from './computers/xml-parser.computer';

export type { YamlParserComputer, FrontmatterResult } from './computers/yaml-parser.computer';
export { createYamlParserComputer } from './computers/yaml-parser.computer';

export type { SearchComputer, SearchConfig, SearchIndex, SearchResult } from './computers/search.computer';
export { createSearchComputer } from './computers/search.computer';

export type {
  ValidationComputer,
  ValidationResult,
  DocValidationResult,
  CheckResult
} from './computers/validation.computer';
export { createValidationComputer } from './computers/validation.computer';

// Handlers
export type { TaskHandler, TaskInfo, ListTasksResult, NextIdResult, DeleteTaskResult } from './handlers/task.handler';
export { createTaskHandler } from './handlers/task.handler';

export type { SpecHandler, SpecInfo, PlanInfo } from './handlers/spec.handler';
export { createSpecHandler } from './handlers/spec.handler';

export type { QuickHandler, QuickInfo, NextQuickIdResult } from './handlers/quick.handler';
export { createQuickHandler } from './handlers/quick.handler';

export type {
  SearchHandler,
  DocSearchResult,
  SearchOutput,
  HybridSearchResult,
  HybridSearchOutput
} from './handlers/search.handler';
export { createSearchHandler } from './handlers/search.handler';

export type {
  DocsHandler,
  ProductDocInfo,
  EngineeringDocInfo,
  ListProductResult,
  ListEngineeringResult,
  CheckDocResult,
  CheckSummary,
  CheckDocsOutput
} from './handlers/docs.handler';
export { createDocsHandler } from './handlers/docs.handler';

export type {
  ValidationHandler,
  XmlValidationError,
  XmlValidationResult,
  YamlValidationError,
  YamlValidationResult,
  DirectiveValidationResult,
  DocQualityOutput
} from './handlers/validation.handler';
export { createValidationHandler } from './handlers/validation.handler';

export type {
  ConfigHandler,
  DirectiveInfo,
  SkillConfigResult,
  DateTimeResult,
  GlossaryTerm,
  GlossaryMatch,
  ExpandQueryResult
} from './handlers/config.handler';
export { createConfigHandler } from './handlers/config.handler';

export type { QueryHandler, DocContent, SelectContextOutput } from './handlers/query.handler';
export { createQueryHandler } from './handlers/query.handler';

// Orchestrator
export type { CliOrchestrator } from './orchestrator';
export { createCliOrchestrator } from './orchestrator';
