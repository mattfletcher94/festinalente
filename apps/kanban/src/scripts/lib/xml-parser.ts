import { XMLParser } from 'fast-xml-parser';

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

export function parseTaskXml(content: string): ParsedTask {
  const result = parser.parse(content);
  const task = result.task;
  return {
    id: task.id || '',
    status: task.status || '',
    priority: task.priority || '',
    title: task.title || '',
    labels: Array.isArray(task.labels?.label) ? task.labels.label :
            task.labels?.label ? [task.labels.label] : [],
    created: task.created || '',
    updated: task.updated || '',
  };
}

export interface ParsedSpec {
  task: string;
  title: string;
  created: string;
  updated: string;
}

export function parseSpecXml(content: string): ParsedSpec {
  const result = parser.parse(content);
  const spec = result.spec;
  return {
    task: spec.task || '',
    title: spec.title || '',
    created: spec.created || '',
    updated: spec.updated || '',
  };
}

export interface ParsedPlan {
  task: string;
  spec: string;
  status: string;
  iteration: number;
  title: string;
}

export function parsePlanXml(content: string): ParsedPlan {
  const result = parser.parse(content);
  const plan = result.plan;
  return {
    task: plan.task || '',
    spec: plan.spec || '',
    status: plan.status || '',
    iteration: parseInt(plan.iteration || '1', 10),
    title: plan.title || '',
  };
}

export interface ParsedQuick {
  id: string;
  title: string;
  created: string;
  updated: string;
}

/**
 * Parse a quick.xml file.
 *
 * @param content - The XML content to parse.
 * @returns Parsed quick task metadata.
 */
export function parseQuickXml(content: string): ParsedQuick {
  const result = parser.parse(content);
  const quick = result.quick;
  return {
    id: quick.id || '',
    title: quick.title || '',
    created: quick.created || '',
    updated: quick.updated || '',
  };
}
