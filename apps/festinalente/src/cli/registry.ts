/**
 * Command registry for the CLI dispatcher.
 *
 * @module cli/registry
 */

import type { CliCommand, CliResult, CommandHandler } from './types';
import { error } from './types';

/**
 * Command registry that maps command names to handlers.
 */
export interface CommandRegistry {
  /**
   * Register a command with the registry.
   *
   * @param command - The command to register.
   * @throws Error if command name already exists.
   */
  readonly register: (command: CliCommand) => void;

  /**
   * Get a command by name.
   *
   * @param name - The command name.
   * @returns The command or undefined if not found.
   */
  readonly get: (name: string) => CliCommand | undefined;

  /**
   * List all registered commands.
   *
   * @returns Array of all registered commands.
   */
  readonly list: () => readonly CliCommand[];

  /**
   * Check if a command exists.
   *
   * @param name - The command name.
   * @returns True if the command exists.
   */
  readonly has: (name: string) => boolean;
}

/**
 * Create a new command registry.
 *
 * @returns A new CommandRegistry instance.
 */
export function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, CliCommand>();

  function register(command: CliCommand): void {
    if (commands.has(command.name)) {
      throw new Error(`Command "${command.name}" is already registered`);
    }
    commands.set(command.name, command);
  }

  function get(name: string): CliCommand | undefined {
    return commands.get(name);
  }

  function list(): readonly CliCommand[] {
    return Array.from(commands.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  function has(name: string): boolean {
    return commands.has(name);
  }

  return { register, get, list, has };
}

/**
 * Help output for a command.
 */
export interface CommandHelp {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
}

/**
 * Help output structure.
 */
export interface HelpOutput {
  readonly commands: readonly CommandHelp[];
}

/**
 * Generate help output from registry.
 *
 * @param registry - The command registry.
 * @returns Help output structure.
 */
export function generateHelp(registry: CommandRegistry): HelpOutput {
  const commands = registry.list().map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    usage: cmd.usage
  }));

  return { commands };
}

/**
 * Execute a command from the registry.
 *
 * @param registry - The command registry.
 * @param commandName - The name of the command to execute.
 * @param args - The arguments to pass to the command.
 * @returns The result of the command execution.
 */
export function executeCommand(registry: CommandRegistry, commandName: string, args: string[]): CliResult<unknown> {
  const command = registry.get(commandName);

  if (!command) {
    const availableCommands = registry.list().map((c) => c.name);
    return error(
      `Unknown command: ${commandName}\n\nAvailable commands:\n${availableCommands.map((c) => `  ${c}`).join('\n')}`
    );
  }

  return command.handler(args);
}

/**
 * Create a command definition helper.
 *
 * @param name - Command name.
 * @param description - Command description.
 * @param usage - Usage string.
 * @param handler - Handler function.
 * @returns A CliCommand object.
 */
export function defineCommand(name: string, description: string, usage: string, handler: CommandHandler): CliCommand {
  return { name, description, usage, handler };
}
