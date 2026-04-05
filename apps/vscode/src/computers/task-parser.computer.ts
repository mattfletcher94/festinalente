/**
 * Task parser computer - pure functions for XML parsing.
 */

import type { Task, TaskStatus } from '../types/task-types';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text'
});

export interface ParsedTask {
  id: string;
  status: string;
  priority: string;
  title: string;
  labels: string[];
  created: string;
  updated: string;
  projectId?: string;
}

export interface CreateTaskParserComputerReturn {
  parseTaskXml(content: string): ParsedTask;
  parseTaskWithPath(content: string, taskPath: string): Task;
}

export function createTaskParserComputer(): CreateTaskParserComputerReturn {
  function parseTaskXml(content: string): ParsedTask {
    const result = parser.parse(content);
    const task = result.task;
    const projectId = task['project-id'] ? String(task['project-id']).trim() : undefined;
    return {
      id: task.id || '',
      status: task.status || '',
      priority: task.priority || '',
      title: task.title || '',
      labels: Array.isArray(task.labels?.label) ? task.labels.label : task.labels?.label ? [task.labels.label] : [],
      created: task.created || '',
      updated: task.updated || '',
      ...(projectId !== undefined && projectId !== '' ? { projectId } : {})
    };
  }

  function parseTaskWithPath(content: string, taskPath: string): Task {
    const parsed = parseTaskXml(content);
    return {
      ...parsed,
      status: parsed.status as TaskStatus,
      taskPath
    };
  }

  return {
    parseTaskXml,
    parseTaskWithPath
  };
}
