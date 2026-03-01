/**
 * XML parsing computer - pure functions for parsing XML content.
 *
 * @module cli/computers/xml-parser
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * Parsed task metadata.
 */
export interface ParsedTask {
  readonly id: string;
  readonly status: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
  readonly labels: readonly string[];
  readonly affects: readonly string[];
  readonly engineering: readonly string[];
  readonly created: string;
  readonly updated: string;
}

/**
 * Parsed spec metadata.
 */
export interface ParsedSpec {
  readonly task: string;
  readonly title: string;
  readonly created: string;
  readonly updated: string;
}

/**
 * Parsed plan metadata.
 */
export interface ParsedPlan {
  readonly task: string;
  readonly spec: string;
  readonly status: string;
  readonly iteration: number;
  readonly title: string;
}

/**
 * Parsed quick task metadata.
 */
export interface ParsedQuick {
  readonly id: string;
  readonly title: string;
  readonly created: string;
  readonly updated: string;
}

/**
 * Parsed plan task item.
 */
export interface ParsedPlanTask {
  readonly taskId: string;
  readonly name: string;
  readonly files: string;
  readonly requirements: string;
  readonly pattern: string;
  readonly context: readonly string[];
  readonly action: string;
  readonly verify: string;
  readonly done: string;
  readonly completed: boolean;
}

/**
 * Parsed plan task context.
 */
export interface ParsedPlanTaskContext {
  readonly taskId: string;
  readonly files: readonly string[];
}

/**
 * XML parser computer interface.
 */
export interface XmlParserComputer {
  /**
   * Parse a task.xml file.
   *
   * @param content - The XML content to parse.
   * @returns Parsed task metadata.
   */
  readonly parseTaskXml: (content: string) => ParsedTask;

  /**
   * Parse a spec.xml file.
   *
   * @param content - The XML content to parse.
   * @returns Parsed spec metadata.
   */
  readonly parseSpecXml: (content: string) => ParsedSpec;

  /**
   * Parse a plan.xml file.
   *
   * @param content - The XML content to parse.
   * @returns Parsed plan metadata.
   */
  readonly parsePlanXml: (content: string) => ParsedPlan;

  /**
   * Parse a quick.xml file.
   *
   * @param content - The XML content to parse.
   * @returns Parsed quick metadata.
   */
  readonly parseQuickXml: (content: string) => ParsedQuick;

  /**
   * Validate XML syntax.
   *
   * @param content - The XML content to validate.
   * @returns True if valid, throws on error.
   */
  readonly validateXml: (content: string) => boolean;

  /**
   * Parse a single task from a plan.xml file by task ID.
   *
   * @param content - The XML content to parse.
   * @param taskId - The task ID to extract.
   * @returns Parsed plan task or null if not found.
   */
  readonly parsePlanTask: (content: string, taskId: string) => ParsedPlanTask | null;

  /**
   * Parse context files for a task from a plan.xml file.
   *
   * @param content - The XML content to parse.
   * @param taskId - The task ID to extract context for.
   * @returns Parsed plan task context or null if not found.
   */
  readonly parsePlanTaskContext: (content: string, taskId: string) => ParsedPlanTaskContext | null;
}

/**
 * Create an XML parser computer.
 *
 * @returns An XmlParserComputer instance.
 */
export function createXmlParserComputer(): XmlParserComputer {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text',
  });

  /**
   * Parse ref elements to extract IDs.
   */
  function parseRefs(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const ref = sectionObj.ref;

    if (Array.isArray(ref)) {
      return ref.map((r) => {
        if (typeof r === 'string') return r.trim();
        if (typeof r === 'object' && r && '_text' in r) return String(r._text).trim();
        return '';
      }).filter(Boolean);
    }

    if (typeof ref === 'string') {
      return [ref.trim()];
    }

    if (typeof ref === 'object' && ref && '_text' in ref) {
      return [String((ref as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  function parseTaskXml(content: string): ParsedTask {
    const result = parser.parse(content);
    const task = result.task;
    return {
      id: task.id || '',
      status: task.status || '',
      priority: task.priority || '',
      title: task.title || '',
      description: task.description || '',
      labels: Array.isArray(task.labels?.label)
        ? task.labels.label
        : task.labels?.label
          ? [task.labels.label]
          : [],
      affects: parseRefs(task.affects),
      engineering: parseRefs(task.engineering),
      created: task.created || '',
      updated: task.updated || '',
    };
  }

  function parseSpecXml(content: string): ParsedSpec {
    const result = parser.parse(content);
    const spec = result.spec;
    return {
      task: spec.task || '',
      title: spec.title || '',
      created: spec.created || '',
      updated: spec.updated || '',
    };
  }

  function parsePlanXml(content: string): ParsedPlan {
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

  function parseQuickXml(content: string): ParsedQuick {
    const result = parser.parse(content);
    const quick = result.quick;
    return {
      id: quick.id || '',
      title: quick.title || '',
      created: quick.created || '',
      updated: quick.updated || '',
    };
  }

  function validateXml(content: string): boolean {
    // This will throw on invalid XML
    parser.parse(content);
    return true;
  }

  /**
   * Parse context file elements from a task.
   */
  function parseContextFiles(context: unknown): readonly string[] {
    if (!context) return [];
    const contextObj = context as Record<string, unknown>;
    const file = contextObj.file;

    if (Array.isArray(file)) {
      return file.map((f) => {
        if (typeof f === 'string') return f.trim();
        if (typeof f === 'object' && f && '_text' in f) return String(f._text).trim();
        return '';
      }).filter(Boolean);
    }

    if (typeof file === 'string') {
      return [file.trim()];
    }

    if (typeof file === 'object' && file && '_text' in file) {
      return [String((file as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  /**
   * Extract text content from an element.
   */
  function extractText(element: unknown): string {
    if (typeof element === 'string') return element.trim();
    if (typeof element === 'object' && element && '_text' in element) {
      return String((element as Record<string, unknown>)._text).trim();
    }
    return '';
  }

  function parsePlanTask(content: string, taskId: string): ParsedPlanTask | null {
    const result = parser.parse(content);
    const plan = result.plan;
    const tasks = plan.tasks?.task;

    if (!tasks) return null;

    const taskList = Array.isArray(tasks) ? tasks : [tasks];
    const found = taskList.find((t: Record<string, unknown>) => String(t.id) === taskId);

    if (!found) return null;

    return {
      taskId: String(found.id || ''),
      name: extractText(found.name),
      files: extractText(found.files),
      requirements: extractText(found.requirements),
      pattern: extractText(found.pattern),
      context: parseContextFiles(found.context),
      action: extractText(found.action),
      verify: extractText(found.verify),
      done: extractText(found.done),
      completed: found.completed === 'true' || found.completed === true,
    };
  }

  function parsePlanTaskContext(content: string, taskId: string): ParsedPlanTaskContext | null {
    const result = parser.parse(content);
    const plan = result.plan;
    const tasks = plan.tasks?.task;

    if (!tasks) return null;

    const taskList = Array.isArray(tasks) ? tasks : [tasks];
    const found = taskList.find((t: Record<string, unknown>) => String(t.id) === taskId);

    if (!found) return null;

    return {
      taskId: String(found.id || ''),
      files: parseContextFiles(found.context),
    };
  }

  return {
    parseTaskXml,
    parseSpecXml,
    parsePlanXml,
    parseQuickXml,
    validateXml,
    parsePlanTask,
    parsePlanTaskContext,
  };
}
