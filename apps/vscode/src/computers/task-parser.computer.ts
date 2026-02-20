/**
 * Task parser computer - pure functions for XML parsing.
 */

import { XMLParser } from 'fast-xml-parser';
import type { Task, TaskStatus } from '../types/task-types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
});

export interface ParsedTask {
  id: string;
  status: string;
  priority: string;
  title: string;
  labels: string[];
  created: string;
  updated: string;
}

export interface CreateTaskParserComputerReturn {
  parseTaskXml(content: string): ParsedTask;
  parseTaskWithPath(content: string, taskPath: string): Task;
}

export function createTaskParserComputer(): CreateTaskParserComputerReturn {
  function parseTaskXml(content: string): ParsedTask {
    const result = parser.parse(content);
    const task = result.task;
    return {
      id: task.id || '',
      status: task.status || '',
      priority: task.priority || '',
      title: task.title || '',
      labels: Array.isArray(task.labels?.label)
        ? task.labels.label
        : task.labels?.label
          ? [task.labels.label]
          : [],
      created: task.created || '',
      updated: task.updated || '',
    };
  }

  function parseTaskWithPath(content: string, taskPath: string): Task {
    const parsed = parseTaskXml(content);
    return {
      ...parsed,
      status: parsed.status as TaskStatus,
      taskPath,
    };
  }

  return {
    parseTaskXml,
    parseTaskWithPath,
  };
}
