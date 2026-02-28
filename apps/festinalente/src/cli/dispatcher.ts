#!/usr/bin/env node

/**
 * CLI Dispatcher - single entry point for all festinalente commands.
 *
 * Usage: festina <command> [args...]
 *
 * @module cli/dispatcher
 */

import { createCliOrchestrator } from './orchestrator';
import { executeCommand } from './registry';
import { isError } from './types';

/**
 * Main dispatcher function.
 */
function main(): void {
  const args = process.argv.slice(2);

  // Create the orchestrator (registers all commands)
  const orchestrator = createCliOrchestrator();
  const { registry } = orchestrator;

  // Helper to get help output
  const getHelpOutput = () => ({
    usage: 'festina <command> [args...]',
    commands: registry.list().map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.usage,
    })),
  });

  // No command provided - show help
  if (args.length === 0) {
    console.log(JSON.stringify(getHelpOutput(), null, 2));
    return;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  // Help command
  if (commandName === 'help' || commandName === '--help' || commandName === '-h') {
    console.log(JSON.stringify(getHelpOutput(), null, 2));
    return;
  }

  // Execute command
  const result = executeCommand(registry, commandName, commandArgs);

  if (isError(result)) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result.data, null, 2));
}

main();
