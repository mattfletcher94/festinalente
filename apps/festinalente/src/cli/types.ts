/**
 * CLI types and interfaces for the festinalente dispatcher.
 *
 * @module cli/types
 */

import { z } from 'zod';

/**
 * Branded type for Task IDs.
 */
export type TaskId = string & { readonly __brand: 'TaskId' };

/**
 * Branded type for Quick task IDs.
 */
export type QuickId = string & { readonly __brand: 'QuickId' };

/**
 * Branded type for Doc IDs.
 */
export type DocId = string & { readonly __brand: 'DocId' };

/**
 * Create a TaskId from a string.
 *
 * @param id - The string to brand as TaskId.
 * @returns The branded TaskId.
 */
export function createTaskId(id: string): TaskId {
  return id as TaskId;
}

/**
 * Create a QuickId from a string.
 *
 * @param id - The string to brand as QuickId.
 * @returns The branded QuickId.
 */
export function createQuickId(id: string): QuickId {
  return id as QuickId;
}

/**
 * Create a DocId from a string.
 *
 * @param id - The string to brand as DocId.
 * @returns The branded DocId.
 */
export function createDocId(id: string): DocId {
  return id as DocId;
}

/**
 * Successful result from a CLI command.
 */
export interface SuccessResult<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Error result from a CLI command.
 */
export interface ErrorResult {
  readonly error: true;
  readonly message: string;
}

/**
 * Union type for CLI command results.
 */
export type CliResult<T> = SuccessResult<T> | ErrorResult;

/**
 * Create a success result.
 *
 * @param data - The data to wrap in a success result.
 * @returns A SuccessResult containing the data.
 */
export function success<T>(data: T): SuccessResult<T> {
  return { success: true, data };
}

/**
 * Create an error result.
 *
 * @param message - The error message.
 * @returns An ErrorResult containing the message.
 */
export function error(message: string): ErrorResult {
  return { error: true, message };
}

/**
 * Check if a result is an error.
 *
 * @param result - The result to check.
 * @returns True if the result is an error.
 */
export function isError<T>(result: CliResult<T>): result is ErrorResult {
  return 'error' in result && result.error === true;
}

/**
 * Check if a result is a success.
 *
 * @param result - The result to check.
 * @returns True if the result is a success.
 */
export function isSuccess<T>(result: CliResult<T>): result is SuccessResult<T> {
  return 'success' in result && result.success === true;
}

/**
 * Handler function type for CLI commands.
 */
export type CommandHandler = (args: string[]) => CliResult<unknown>;

/**
 * CLI command definition.
 */
export interface CliCommand {
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly handler: CommandHandler;
}

/**
 * Zod schema for task ID argument.
 */
export const taskIdSchema = z.string().min(1, 'Task ID is required');

/**
 * Zod schema for quick ID argument.
 */
export const quickIdSchema = z.string().min(1, 'Quick ID is required');

/**
 * Zod schema for keyword arguments (search terms).
 */
export const keywordsSchema = z.array(z.string()).min(1, 'At least one keyword is required');

/**
 * Zod schema for optional min-score argument.
 */
export const minScoreSchema = z.coerce.number().min(0).max(1).default(0.3);

/**
 * Zod schema for doc type filter.
 */
export const docTypeSchema = z.enum(['product', 'engineering']).optional();

/**
 * Zod schema for context tier.
 */
export const contextTierSchema = z.enum(['minimal', 'standard', 'full']).default('standard');

/**
 * Parsed CLI arguments structure.
 */
export interface ParsedArgs {
  readonly positional: string[];
  readonly flags: Record<string, string | boolean>;
}

/**
 * Parse CLI arguments into positional args and flags.
 *
 * @param args - Raw argument array.
 * @returns Parsed arguments with positional and flags separated.
 */
export function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value ?? true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

/**
 * Get a string flag value.
 *
 * @param flags - The flags object.
 * @param key - The flag key.
 * @returns The string value or undefined.
 */
export function getStringFlag(flags: Record<string, string | boolean>, key: string): string | undefined {
  const value = flags[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Get a boolean flag value.
 *
 * @param flags - The flags object.
 * @param key - The flag key.
 * @returns True if the flag is present.
 */
export function getBoolFlag(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true || flags[key] === 'true';
}

/**
 * Get a number flag value.
 *
 * @param flags - The flags object.
 * @param key - The flag key.
 * @returns The number value or undefined.
 */
export function getNumberFlag(flags: Record<string, string | boolean>, key: string): number | undefined {
  const value = flags[key];
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}
