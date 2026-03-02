/**
 * Git capability - I/O operations for git commands.
 *
 * Uses execFile instead of execSync to prevent command injection.
 *
 * @module cli/capabilities/git
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Result } from './file-system.capability';
import { ok, err } from './file-system.capability';

const execFileAsync = promisify(execFile);

/**
 * Git capability interface.
 */
export interface GitCapability {
  /**
   * Get the last commit date for a file.
   *
   * @param filePath - The file path.
   * @returns Result with date or error.
   */
  readonly getLastCommitDate: (filePath: string) => Promise<Result<Date | null, Error>>;

  /**
   * Get the current git branch.
   *
   * @returns Result with branch name or error.
   */
  readonly getCurrentBranch: () => Promise<Result<string, Error>>;

  /**
   * Get the last commit date for a file synchronously.
   *
   * @param filePath - The file path.
   * @returns The date or null if not available.
   */
  readonly getLastCommitDateSync: (filePath: string) => Date | null;
}

/**
 * Create a git capability.
 *
 * @returns A GitCapability instance.
 */
export function createGitCapability(): GitCapability {
  async function getLastCommitDate(filePath: string): Promise<Result<Date | null, Error>> {
    try {
      // Use execFile with argument array to prevent command injection
      const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', filePath]);
      const dateStr = stdout.trim();

      if (!dateStr) {
        return ok(null);
      }

      return ok(new Date(dateStr));
    } catch (e) {
      // File might not be tracked by git
      return ok(null);
    }
  }

  async function getCurrentBranch(): Promise<Result<string, Error>> {
    try {
      const { stdout } = await execFileAsync('git', ['branch', '--show-current']);
      return ok(stdout.trim());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  function getLastCommitDateSync(filePath: string): Date | null {
    // Use spawnSync for synchronous operation with argument array
    const { spawnSync } = require('child_process');
    try {
      const result = spawnSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (result.status === 0 && result.stdout) {
        const dateStr = result.stdout.trim();
        if (dateStr) {
          return new Date(dateStr);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  return {
    getLastCommitDate,
    getCurrentBranch,
    getLastCommitDateSync,
  };
}
