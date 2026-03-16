/**
 * Orchestrator - wires together all CLI components.
 *
 * This module creates and configures all capabilities, computers, and handlers,
 * then registers all commands with the command registry.
 *
 * @module cli/orchestrator
 */

import { type CommandRegistry, createCommandRegistry } from './registry';
import { createConfigHandler } from './handlers/config.handler';
import { createProjectHandler } from './handlers/project.handler';
import { createDocsHandler } from './handlers/docs.handler';
import { createFileSystemCapability } from './capabilities/file-system.capability';
import { createQueryHandler } from './handlers/query.handler';
import { createQuickHandler } from './handlers/quick.handler';
import { createSearchComputer } from './computers/search.computer';
import { createSearchHandler } from './handlers/search.handler';
import { createSpecHandler } from './handlers/spec.handler';
import { createTaskHandler } from './handlers/task.handler';
import { createTaskResolverComputer } from './computers/task-resolver.computer';
import { createValidationComputer } from './computers/validation.computer';
import { createValidationHandler } from './handlers/validation.handler';
import { createXmlParserComputer } from './computers/xml-parser.computer';
import { createYamlParserComputer } from './computers/yaml-parser.computer';

/**
 * CLI application orchestrator.
 */
export interface CliOrchestrator {
  readonly registry: CommandRegistry;
}

/**
 * Create and configure the CLI application.
 *
 * @returns The configured CLI orchestrator.
 */
export function createCliOrchestrator(): CliOrchestrator {
  // Create capabilities (I/O operations)
  const fs = createFileSystemCapability();

  // Create computers (pure logic)
  const xmlParser = createXmlParserComputer();
  const yamlParser = createYamlParserComputer();
  const search = createSearchComputer();
  const taskResolver = createTaskResolverComputer();
  const validation = createValidationComputer();

  // Create handlers with injected dependencies
  const taskHandler = createTaskHandler({ fs, xmlParser, taskResolver });
  const specHandler = createSpecHandler({ fs, xmlParser, taskResolver });
  const quickHandler = createQuickHandler({ fs, xmlParser });
  const searchHandler = createSearchHandler({ fs, yamlParser, search });
  const docsHandler = createDocsHandler({ fs, yamlParser });
  const validationHandler = createValidationHandler({ fs, yamlParser, validation, taskResolver });
  const configHandler = createConfigHandler({ fs, yamlParser });
  const queryHandler = createQueryHandler({ fs, yamlParser, xmlParser });
  const projectHandler = createProjectHandler({ fs, xmlParser });

  // Create command registry
  const registry = createCommandRegistry();

  // Register all commands from handlers
  for (const command of taskHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of specHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of quickHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of searchHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of docsHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of validationHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of configHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of queryHandler.getCommands()) {
    registry.register(command);
  }

  for (const command of projectHandler.getCommands()) {
    registry.register(command);
  }

  return {
    registry
  };
}
