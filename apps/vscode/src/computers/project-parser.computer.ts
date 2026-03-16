/**
 * Project parser computer - pure functions for project XML parsing.
 */

import type { Project, ProjectStatus } from '../types/project-types';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text'
});

/**
 * Parsed project metadata extracted from project.xml.
 */
export interface ParsedProject {
  readonly id: string;
  readonly status: string;
  readonly title: string;
  readonly created: string;
  readonly updated: string;
}

/**
 * Return type for the project parser computer factory.
 */
export interface CreateProjectParserComputerReturn {
  /**
   * Parse raw project XML content into structured metadata.
   *
   * @param content - The XML string to parse.
   * @returns Parsed project metadata.
   */
  parseProjectXml(content: string): ParsedProject;

  /**
   * Parse project XML and enrich with path and task counts.
   *
   * @param content - The XML string to parse.
   * @param projectPath - Absolute path to the project directory.
   * @param taskCount - Total number of tasks in the project.
   * @param completedCount - Number of completed tasks in the project.
   * @returns Fully hydrated Project object.
   */
  parseProjectWithPath(content: string, projectPath: string, taskCount: number, completedCount: number): Project;
}

/**
 * Create a project parser computer with pure XML parsing functions.
 *
 * @returns Project parser computer instance.
 */
export function createProjectParserComputer(): CreateProjectParserComputerReturn {
  /**
   * Parse raw project XML content into structured metadata.
   *
   * @param content - The XML string to parse.
   * @returns Parsed project metadata.
   */
  function parseProjectXml(content: string): ParsedProject {
    const result = parser.parse(content);
    const project = result.project;
    return {
      id: project.id || '',
      status: project.status || 'open',
      title: typeof project.title === 'object' ? (project.title._text || '') : String(project.title || ''),
      created: project.created || '',
      updated: project.updated || ''
    };
  }

  /**
   * Parse project XML and enrich with path and task counts.
   *
   * @param content - The XML string to parse.
   * @param projectPath - Absolute path to the project directory.
   * @param taskCount - Total number of tasks in the project.
   * @param completedCount - Number of completed tasks in the project.
   * @returns Fully hydrated Project object.
   */
  function parseProjectWithPath(
    content: string,
    projectPath: string,
    taskCount: number,
    completedCount: number
  ): Project {
    const parsed = parseProjectXml(content);
    return {
      ...parsed,
      status: parsed.status as ProjectStatus,
      taskCount,
      completedCount,
      projectPath
    };
  }

  return {
    parseProjectXml,
    parseProjectWithPath
  };
}
