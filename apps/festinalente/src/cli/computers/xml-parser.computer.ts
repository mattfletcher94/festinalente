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
  readonly projectId?: string;
  readonly projectRequirements?: readonly string[];
}

/**
 * Parsed project metadata.
 */
export interface ParsedProject {
  readonly id: string;
  readonly status: 'open' | 'in-progress' | 'done';
  readonly title: string;
  readonly description: string;
  readonly problem: string;
  readonly value: string;
  readonly scope: {
    readonly inScope: readonly string[];
    readonly outOfScope: readonly string[];
  };
  readonly requirements: readonly { readonly id: string; readonly text: string }[];
  readonly acceptanceCriteria: string;
  readonly tasks: readonly string[];
  readonly notes: string;
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
   * Parse a project.xml file.
   *
   * @param content - The XML content to parse.
   * @returns Parsed project metadata.
   */
  readonly parseProjectXml: (content: string) => ParsedProject;

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
    textNodeName: '_text'
  });

  /**
   * Parse ref elements to extract IDs.
   */
  function parseRefs(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const ref = sectionObj.ref;

    if (Array.isArray(ref)) {
      return ref
        .map((r) => {
          if (typeof r === 'string') return r.trim();
          if (typeof r === 'object' && r && '_text' in r) return String(r._text).trim();
          return '';
        })
        .filter(Boolean);
    }

    if (typeof ref === 'string') {
      return [ref.trim()];
    }

    if (typeof ref === 'object' && ref && '_text' in ref) {
      return [String((ref as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  /**
   * Parse doc elements to extract id attributes.
   *
   * @param section - The section containing doc elements.
   * @returns Array of doc id strings.
   */
  function parseDocIds(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const doc = sectionObj.doc;

    if (Array.isArray(doc)) {
      return doc
        .map((d) => {
          if (typeof d === 'string') return d.trim();
          if (typeof d === 'object' && d && 'id' in d) return String((d as Record<string, unknown>).id).trim();
          if (typeof d === 'object' && d && '_text' in d) return String((d as Record<string, unknown>)._text).trim();
          return '';
        })
        .filter(Boolean);
    }

    if (typeof doc === 'string') {
      return [doc.trim()];
    }

    if (typeof doc === 'object' && doc && 'id' in doc) {
      return [String((doc as Record<string, unknown>).id).trim()];
    }

    if (typeof doc === 'object' && doc && '_text' in doc) {
      return [String((doc as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  /**
   * Parse item elements from a section.
   *
   * @param section - The section containing item elements.
   * @returns Array of item text strings.
   */
  function parseItems(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const item = sectionObj.item;

    if (Array.isArray(item)) {
      return item.map((i) => extractText(i)).filter(Boolean);
    }

    if (item !== undefined && item !== null) {
      const text = extractText(item);
      return text ? [text] : [];
    }

    return [];
  }

  /**
   * Parse requirement elements with id and text content.
   *
   * @param section - The section containing requirement elements.
   * @returns Array of requirement objects with id and text.
   */
  function parseRequirements(section: unknown): readonly { readonly id: string; readonly text: string }[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const req = sectionObj.requirement;

    if (!req) return [];

    const reqList = Array.isArray(req) ? req : [req];
    return reqList
      .map((r) => {
        if (typeof r === 'object' && r) {
          const rObj = r as Record<string, unknown>;
          return {
            id: String(rObj.id || '').trim(),
            text: extractText(r)
          };
        }
        return { id: '', text: extractText(r) };
      })
      .filter((r) => r.id || r.text);
  }

  /**
   * Parse task ref elements from a tasks section.
   *
   * @param section - The section containing task elements.
   * @returns Array of task ref strings.
   */
  function parseTaskRefs(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const task = sectionObj.task;

    if (Array.isArray(task)) {
      return task
        .map((t) => {
          if (typeof t === 'string') return t.trim();
          if (typeof t === 'object' && t && 'ref' in t) return String((t as Record<string, unknown>).ref).trim();
          if (typeof t === 'object' && t && '_text' in t) return String((t as Record<string, unknown>)._text).trim();
          return '';
        })
        .filter(Boolean);
    }

    if (typeof task === 'string') {
      return [task.trim()];
    }

    if (typeof task === 'object' && task && 'ref' in task) {
      return [String((task as Record<string, unknown>).ref).trim()];
    }

    if (typeof task === 'object' && task && '_text' in task) {
      return [String((task as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  /**
   * Parse acceptance criteria elements into a single string.
   *
   * @param section - The section containing criterion elements.
   * @returns Concatenated acceptance criteria string.
   */
  function parseAcceptanceCriteria(section: unknown): string {
    if (!section) return '';
    if (typeof section === 'string') return section.trim();

    const sectionObj = section as Record<string, unknown>;
    const criterion = sectionObj.criterion;

    if (!criterion) return extractText(section);

    if (Array.isArray(criterion)) {
      return criterion.map((c) => extractText(c)).filter(Boolean).join('\n');
    }

    return extractText(criterion);
  }

  /**
   * Parse req ref elements from a project-requirements section.
   *
   * @param section - The section containing req elements.
   * @returns Array of requirement ref strings.
   */
  function parseReqRefs(section: unknown): readonly string[] {
    if (!section) return [];
    const sectionObj = section as Record<string, unknown>;
    const req = sectionObj.req;

    if (Array.isArray(req)) {
      return req
        .map((r) => {
          if (typeof r === 'string') return r.trim();
          if (typeof r === 'object' && r && 'ref' in r) return String((r as Record<string, unknown>).ref).trim();
          if (typeof r === 'object' && r && '_text' in r) return String((r as Record<string, unknown>)._text).trim();
          return '';
        })
        .filter(Boolean);
    }

    if (typeof req === 'string') {
      return [req.trim()];
    }

    if (typeof req === 'object' && req && 'ref' in req) {
      return [String((req as Record<string, unknown>).ref).trim()];
    }

    if (typeof req === 'object' && req && '_text' in req) {
      return [String((req as Record<string, unknown>)._text).trim()];
    }

    return [];
  }

  /**
   * Parse a project.xml file into structured metadata.
   *
   * @param content - The XML content to parse.
   * @returns Parsed project metadata.
   */
  function parseProjectXml(content: string): ParsedProject {
    const result = parser.parse(content);
    const project = result.project;
    return {
      id: project.id || '',
      status: (project.status || 'open') as 'open' | 'in-progress' | 'done',
      title: extractText(project.title),
      description: extractText(project.description),
      problem: extractText(project.problem),
      value: extractText(project.value),
      scope: {
        inScope: parseItems(project.scope?.['in-scope']),
        outOfScope: parseItems(project.scope?.['out-of-scope'])
      },
      requirements: parseRequirements(project.requirements),
      acceptanceCriteria: parseAcceptanceCriteria(project['acceptance-criteria']),
      tasks: parseTaskRefs(project.tasks),
      notes: extractText(project.notes),
      affects: parseDocIds(project.affects),
      engineering: parseDocIds(project.engineering),
      created: project.created || '',
      updated: project.updated || ''
    };
  }

  function parseTaskXml(content: string): ParsedTask {
    const result = parser.parse(content);
    const task = result.task;
    const projectId = task['project-id'] ? String(task['project-id']).trim() : undefined;
    const projectRequirements = task['project-requirements']
      ? parseReqRefs(task['project-requirements'])
      : undefined;
    return {
      id: task.id || '',
      status: task.status || '',
      priority: task.priority || '',
      title: task.title || '',
      description: task.description || '',
      labels: Array.isArray(task.labels?.label) ? task.labels.label : task.labels?.label ? [task.labels.label] : [],
      affects: parseRefs(task.affects),
      engineering: parseRefs(task.engineering),
      created: task.created || '',
      updated: task.updated || '',
      ...(projectId !== undefined ? { projectId } : {}),
      ...(projectRequirements !== undefined ? { projectRequirements } : {})
    };
  }

  function parseSpecXml(content: string): ParsedSpec {
    const result = parser.parse(content);
    const spec = result.spec;
    return {
      task: spec.task || '',
      title: spec.title || '',
      created: spec.created || '',
      updated: spec.updated || ''
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
      title: plan.title || ''
    };
  }

  function parseQuickXml(content: string): ParsedQuick {
    const result = parser.parse(content);
    const quick = result.quick;
    return {
      id: quick.id || '',
      title: quick.title || '',
      created: quick.created || '',
      updated: quick.updated || ''
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
      return file
        .map((f) => {
          if (typeof f === 'string') return f.trim();
          if (typeof f === 'object' && f && '_text' in f) return String(f._text).trim();
          return '';
        })
        .filter(Boolean);
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
      completed: found.completed === 'true' || found.completed === true
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
      files: parseContextFiles(found.context)
    };
  }

  return {
    parseProjectXml,
    parseTaskXml,
    parseSpecXml,
    parsePlanXml,
    parseQuickXml,
    validateXml,
    parsePlanTask,
    parsePlanTaskContext
  };
}
