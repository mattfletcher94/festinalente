/**
 * Plan parser computer - pure functions for parsing plan.xml structure.
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * Parsed symbol data for plan.xml elements.
 */
export interface PlanSymbol {
  readonly name: string;
  readonly kind: 'plan' | 'section' | 'task' | 'item';
  readonly startLine: number;
  readonly endLine: number;
  readonly children: PlanSymbol[];
  readonly detail?: string;
  readonly completed?: boolean;
}

/**
 * Return type for the plan parser computer.
 */
export interface CreatePlanParserComputerReturn {
  /**
   * Parse plan.xml content and return hierarchical symbols.
   *
   * @param content - Raw XML content of plan.xml file.
   * @returns Array of plan symbols (typically one root plan element).
   */
  parsePlanSymbols(content: string): PlanSymbol[];
}

/**
 * Create a plan parser computer for parsing plan.xml files.
 *
 * @returns Plan parser computer with parsing functions.
 */
export function createPlanParserComputer(): CreatePlanParserComputerReturn {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text'
  });

  const MAX_LABEL_LENGTH = 60;
  const CHECKMARK = '\u2713 ';
  const CIRCLE = '\u25CB ';

  /**
   * Truncate label to max length with ellipsis.
   */
  function truncateLabel(label: string, maxLength = MAX_LABEL_LENGTH): string {
    if (label.length <= maxLength) return label;
    return label.slice(0, maxLength - 3) + '...';
  }

  /**
   * Get status prefix for task items.
   */
  function getStatusPrefix(completed: boolean): string {
    return completed ? CHECKMARK : CIRCLE;
  }

  /**
   * Build a map of element tags to their line numbers.
   * Uses regex scanning since fast-xml-parser doesn't expose line numbers.
   */
  function buildLineMap(content: string): Map<string, number[]> {
    const lineMap = new Map<string, number[]>();
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match opening tags like <plan, <tasks>, <task id="1", <testing>, etc.
      const tagMatches = line.matchAll(/<(\w+)(?:\s|>|\/)/g);
      for (const match of tagMatches) {
        const tagName = match[1];
        const existing = lineMap.get(tagName) ?? [];
        existing.push(i);
        lineMap.set(tagName, existing);
      }

      // Special handling for task elements with id attribute
      const taskIdMatch = line.match(/<task\s+id="(\d+)"/);
      if (taskIdMatch) {
        const taskKey = `task-${taskIdMatch[1]}`;
        const existing = lineMap.get(taskKey) ?? [];
        existing.push(i);
        lineMap.set(taskKey, existing);
      }
    }

    return lineMap;
  }

  /**
   * Find the closing line for an element starting at given line.
   */
  function findEndLine(content: string, tagName: string, startLine: number): number {
    const lines = content.split('\n');
    let depth = 0;
    const openTag = new RegExp(`<${tagName}(\\s|>|/)`);
    const closeTag = new RegExp(`</${tagName}>`);
    const selfClosing = new RegExp(`<${tagName}[^>]*/>`);

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      // Check for self-closing tag
      if (i === startLine && selfClosing.test(line)) {
        return i;
      }

      // Count opening tags
      if (openTag.test(line)) {
        depth++;
      }

      // Count closing tags
      if (closeTag.test(line)) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }

    // If no closing tag found, return last line
    return lines.length - 1;
  }

  /**
   * Parse a section (tasks, testing, edge-cases, pitfalls, notes) into symbols.
   */
  function parseSection(
    sectionName: string,
    sectionData: unknown,
    lineMap: Map<string, number[]>,
    content: string,
    sectionIndex: number
  ): PlanSymbol | undefined {
    if (!sectionData) return undefined;

    const sectionLines = lineMap.get(sectionName) ?? [];
    const startLine = sectionLines[sectionIndex] ?? 0;
    const endLine = findEndLine(content, sectionName, startLine);

    const children: PlanSymbol[] = [];

    // Handle tasks section
    if (sectionName === 'tasks') {
      const tasksObj = sectionData as Record<string, unknown>;
      const taskItems = tasksObj.task;

      if (taskItems) {
        const taskArray = Array.isArray(taskItems) ? taskItems : [taskItems];
        taskArray.forEach((task, index) => {
          const taskObj = task as Record<string, unknown>;
          const taskId = String(taskObj.id ?? index + 1);
          const taskName = String(taskObj.name ?? `Task ${taskId}`);
          const isCompleted = taskObj.completed === 'true' || taskObj.completed === true;

          const taskLines = lineMap.get(`task-${taskId}`) ?? lineMap.get('task') ?? [];
          const taskStartLine = taskLines[index] ?? startLine + 1;
          const taskEndLine = findEndLine(content, 'task', taskStartLine);

          const prefix = getStatusPrefix(isCompleted);
          const label = truncateLabel(`${prefix}${taskId}: ${taskName}`);

          children.push({
            name: label,
            kind: 'task',
            startLine: taskStartLine,
            endLine: taskEndLine,
            children: [],
            completed: isCompleted
          });
        });
      }
    }

    // Handle testing section
    if (sectionName === 'testing') {
      const testingObj = sectionData as Record<string, unknown>;

      // Automated tests
      if (testingObj.automated) {
        const automatedLines = lineMap.get('automated') ?? [];
        const automatedStart = automatedLines[0] ?? startLine + 1;
        const automatedEnd = findEndLine(content, 'automated', automatedStart);

        children.push({
          name: 'Automated',
          kind: 'item',
          startLine: automatedStart,
          endLine: automatedEnd,
          children: []
        });
      }

      // Manual tests
      if (testingObj.manual) {
        const manualLines = lineMap.get('manual') ?? [];
        const manualStart = manualLines[0] ?? startLine + 1;
        const manualEnd = findEndLine(content, 'manual', manualStart);

        children.push({
          name: 'Manual',
          kind: 'item',
          startLine: manualStart,
          endLine: manualEnd,
          children: []
        });
      }

      // Regression tests
      if (testingObj.regression) {
        const regressionLines = lineMap.get('regression') ?? [];
        const regressionStart = regressionLines[0] ?? startLine + 1;
        const regressionEnd = findEndLine(content, 'regression', regressionStart);

        children.push({
          name: 'Regression',
          kind: 'item',
          startLine: regressionStart,
          endLine: regressionEnd,
          children: []
        });
      }
    }

    // Handle edge-cases section
    if (sectionName === 'edge-cases') {
      const casesObj = sectionData as Record<string, unknown>;
      const caseItems = casesObj.case;

      if (caseItems) {
        const caseArray = Array.isArray(caseItems) ? caseItems : [caseItems];
        const caseLines = lineMap.get('case') ?? [];

        caseArray.forEach((caseItem, index) => {
          const caseObj = caseItem as Record<string, unknown>;
          const scenario = String(caseObj.scenario ?? `Case ${index + 1}`);
          const caseStart = caseLines[index] ?? startLine + 1;

          children.push({
            name: truncateLabel(scenario),
            kind: 'item',
            startLine: caseStart,
            endLine: caseStart,
            children: []
          });
        });
      }
    }

    // Handle pitfalls section
    if (sectionName === 'pitfalls') {
      const pitfallsObj = sectionData as Record<string, unknown>;
      const pitfallItems = pitfallsObj.pitfall;

      if (pitfallItems) {
        const pitfallArray = Array.isArray(pitfallItems) ? pitfallItems : [pitfallItems];
        const pitfallLines = lineMap.get('pitfall') ?? [];

        pitfallArray.forEach((pitfall, index) => {
          const pitfallObj = pitfall as Record<string, unknown>;
          const issue = String(pitfallObj.issue ?? `Pitfall ${index + 1}`);
          const pitfallStart = pitfallLines[index] ?? startLine + 1;

          children.push({
            name: truncateLabel(issue),
            kind: 'item',
            startLine: pitfallStart,
            endLine: pitfallStart,
            children: []
          });
        });
      }
    }

    return {
      name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
      kind: 'section',
      startLine,
      endLine,
      children
    };
  }

  /**
   * Parse plan.xml content and return hierarchical symbols.
   */
  function parsePlanSymbols(content: string): PlanSymbol[] {
    try {
      const lineMap = buildLineMap(content);
      const parsed = parser.parse(content);

      if (!parsed.plan) {
        return [];
      }

      const plan = parsed.plan as Record<string, unknown>;
      const taskId = String(plan.task ?? '');
      const title = String(plan.title ?? 'Plan');
      const planLabel = truncateLabel(taskId ? `Plan ${taskId}: ${title}` : title);

      const planLines = lineMap.get('plan') ?? [0];
      const planStartLine = planLines[0] ?? 0;
      const totalLines = content.split('\n').length;
      const planEndLine = totalLines - 1;

      const sections: PlanSymbol[] = [];

      // Parse each section
      const sectionNames = ['tasks', 'testing', 'edge-cases', 'pitfalls', 'notes'];
      let sectionIndices: Record<string, number> = {};

      for (const sectionName of sectionNames) {
        const index = sectionIndices[sectionName] ?? 0;
        sectionIndices[sectionName] = index + 1;

        const sectionData = plan[sectionName];
        if (sectionData) {
          const section = parseSection(sectionName, sectionData, lineMap, content, index);
          if (section) {
            sections.push(section);
          }
        }
      }

      // Handle overview as a section if present
      if (plan.overview) {
        const overviewLines = lineMap.get('overview') ?? [];
        const overviewStart = overviewLines[0] ?? planStartLine + 1;
        const overviewEnd = findEndLine(content, 'overview', overviewStart);

        sections.unshift({
          name: 'Overview',
          kind: 'section',
          startLine: overviewStart,
          endLine: overviewEnd,
          children: []
        });
      }

      // Handle approach as a section if present
      if (plan.approach) {
        const approachLines = lineMap.get('approach') ?? [];
        const approachStart = approachLines[0] ?? planStartLine + 1;
        const approachEnd = findEndLine(content, 'approach', approachStart);

        const approachIndex = sections.findIndex((s) => s.name === 'Tasks');
        const insertIndex = approachIndex >= 0 ? approachIndex : sections.length;

        sections.splice(insertIndex, 0, {
          name: 'Approach',
          kind: 'section',
          startLine: approachStart,
          endLine: approachEnd,
          children: []
        });
      }

      return [
        {
          name: planLabel,
          kind: 'plan',
          startLine: planStartLine,
          endLine: planEndLine,
          children: sections
        }
      ];
    } catch (err) {
      console.warn('Failed to parse plan.xml:', err);
      return [];
    }
  }

  return { parsePlanSymbols };
}
