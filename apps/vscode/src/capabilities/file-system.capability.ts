/**
 * File system capability - mechanism for file operations.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CreateFileSystemCapabilityReturn {
  exists(filePath: string): boolean;
  readFile(filePath: string): string;
  readDir(dirPath: string): string[];
  isDirectory(filePath: string): boolean;
  joinPath(...parts: string[]): string;
}

export function createFileSystemCapability(): CreateFileSystemCapabilityReturn {
  function exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  function readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  function readDir(dirPath: string): string[] {
    return fs.readdirSync(dirPath);
  }

  function isDirectory(filePath: string): boolean {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  function joinPath(...parts: string[]): string {
    return path.join(...parts);
  }

  return {
    exists,
    readFile,
    readDir,
    isDirectory,
    joinPath
  };
}
