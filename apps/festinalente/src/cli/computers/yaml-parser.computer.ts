/**
 * YAML parsing computer - pure functions for parsing YAML content.
 *
 * @module cli/computers/yaml-parser
 */

import * as matter from 'gray-matter';
import * as yaml from 'js-yaml';

/**
 * Parsed frontmatter result.
 */
export interface FrontmatterResult {
  readonly data: Record<string, unknown>;
  readonly content: string;
}

/**
 * YAML parser computer interface.
 */
export interface YamlParserComputer {
  /**
   * Parse YAML frontmatter from markdown content.
   *
   * @param content - The markdown content with frontmatter.
   * @returns Parsed frontmatter data and body content.
   */
  readonly parseFrontmatter: (content: string) => FrontmatterResult;

  /**
   * Parse a YAML string.
   *
   * @param content - The YAML content to parse.
   * @returns Parsed YAML as an object.
   */
  readonly parseYaml: (content: string) => unknown;

  /**
   * Validate YAML syntax.
   *
   * @param content - The YAML content to validate.
   * @returns True if valid, throws on error.
   */
  readonly validateYaml: (content: string) => boolean;
}

/**
 * Create a YAML parser computer.
 *
 * @returns A YamlParserComputer instance.
 */
export function createYamlParserComputer(): YamlParserComputer {
  function parseFrontmatter(content: string): FrontmatterResult {
    const { data, content: body } = matter(content);
    return {
      data: data as Record<string, unknown>,
      content: body,
    };
  }

  function parseYaml(content: string): unknown {
    return yaml.load(content);
  }

  function validateYaml(content: string): boolean {
    // This will throw on invalid YAML
    yaml.load(content);
    return true;
  }

  return {
    parseFrontmatter,
    parseYaml,
    validateYaml,
  };
}
