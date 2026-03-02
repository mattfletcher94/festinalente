/**
 * File system capability - I/O operations for file access.
 *
 * @module cli/capabilities/file-system
 */

import fs from 'fs';
import path from 'path';

/**
 * Result type for operations that can fail.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Create a success result.
 *
 * @param value - The success value.
 * @returns A success result.
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result.
 *
 * @param error - The error.
 * @returns An error result.
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Directory entry information.
 */
export interface DirEntry {
  readonly name: string;
  readonly isDirectory: boolean;
  readonly isFile: boolean;
}

/**
 * File system capability interface.
 */
export interface FileSystemCapability {
  /**
   * Read a file as text.
   *
   * @param filePath - The path to read.
   * @returns Result with file content or error.
   */
  readonly readFile: (filePath: string) => Result<string, Error>;

  /**
   * Write content to a file.
   *
   * @param filePath - The path to write.
   * @param content - The content to write.
   * @returns Result with void or error.
   */
  readonly writeFile: (filePath: string, content: string) => Result<void, Error>;

  /**
   * Check if a path exists.
   *
   * @param filePath - The path to check.
   * @returns True if the path exists.
   */
  readonly exists: (filePath: string) => boolean;

  /**
   * Check if a path is a directory.
   *
   * @param filePath - The path to check.
   * @returns True if the path is a directory.
   */
  readonly isDirectory: (filePath: string) => boolean;

  /**
   * Read directory entries.
   *
   * @param dirPath - The directory path.
   * @returns Result with entries or error.
   */
  readonly readDir: (dirPath: string) => Result<readonly DirEntry[], Error>;

  /**
   * List subdirectory names in a directory.
   *
   * @param dirPath - The directory path.
   * @returns Result with directory names or error.
   */
  readonly listDirectories: (dirPath: string) => Result<readonly string[], Error>;

  /**
   * Join path segments.
   *
   * @param parts - Path segments.
   * @returns Joined path.
   */
  readonly joinPath: (...parts: string[]) => string;

  /**
   * Get the relative path from one path to another.
   *
   * @param from - The from path.
   * @param to - The to path.
   * @returns The relative path.
   */
  readonly relativePath: (from: string, to: string) => string;

  /**
   * Get the directory name of a path.
   *
   * @param filePath - The path.
   * @returns The directory name.
   */
  readonly dirname: (filePath: string) => string;

  /**
   * Get the base name of a path.
   *
   * @param filePath - The path.
   * @param ext - Optional extension to remove.
   * @returns The base name.
   */
  readonly basename: (filePath: string, ext?: string) => string;

  /**
   * Delete a file.
   *
   * @param filePath - The path to delete.
   * @returns Result with void or error.
   */
  readonly deleteFile: (filePath: string) => Result<void, Error>;

  /**
   * Recursively scan a directory for files matching a pattern.
   *
   * @param dirPath - The directory to scan.
   * @param extension - File extension to match (e.g., '.md').
   * @returns Result with file paths or error.
   */
  readonly scanRecursive: (dirPath: string, extension: string) => Result<readonly string[], Error>;
}

/**
 * Create a file system capability.
 *
 * @returns A FileSystemCapability instance.
 */
export function createFileSystemCapability(): FileSystemCapability {
  function readFile(filePath: string): Result<string, Error> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return ok(content);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  function writeFile(filePath: string, content: string): Result<void, Error> {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  function exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  function isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  function readDir(dirPath: string): Result<readonly DirEntry[], Error> {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return ok(
        entries.map((entry) => ({
          name: entry.name,
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
        }))
      );
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  function listDirectories(dirPath: string): Result<readonly string[], Error> {
    const result = readDir(dirPath);
    if (!result.ok) return result;

    return ok(result.value.filter((e) => e.isDirectory).map((e) => e.name));
  }

  function joinPath(...parts: string[]): string {
    return path.join(...parts);
  }

  function relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  function dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  function basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  function deleteFile(filePath: string): Result<void, Error> {
    try {
      fs.unlinkSync(filePath);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  function scanRecursive(dirPath: string, extension: string): Result<readonly string[], Error> {
    try {
      if (!fs.existsSync(dirPath)) {
        return ok([]);
      }

      const files: string[] = [];

      function scan(dir: string): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      }

      scan(dirPath);
      return ok(files);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  return {
    readFile,
    writeFile,
    exists,
    isDirectory,
    readDir,
    listDirectories,
    joinPath,
    relativePath,
    dirname,
    basename,
    deleteFile,
    scanRecursive,
  };
}
