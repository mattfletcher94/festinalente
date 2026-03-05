/**
 * Quick parser computer - pure functions for XML parsing.
 */

import type { Quick, QuickStatus } from '../types/quick-types';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
});

export interface ParsedQuick {
  id: string;
  status: string;
  title: string;
  problem: string;
  done: string;
  created: string;
  updated: string;
}

export interface CreateQuickParserComputerReturn {
  parseQuickXml(content: string): ParsedQuick;
  parseQuickWithPath(content: string, quickPath: string): Quick;
}

/**
 * Create a quick parser computer for parsing quick.xml files.
 *
 * @returns Parser functions for quick XML content.
 */
export function createQuickParserComputer(): CreateQuickParserComputerReturn {
  function parseQuickXml(content: string): ParsedQuick {
    const result = parser.parse(content);
    const quick = result.quick;
    return {
      id: quick.id || '',
      status: quick.status || '',
      title: quick.title || '',
      problem: quick.problem || '',
      done: quick.done || '',
      created: quick.created || '',
      updated: quick.updated || '',
    };
  }

  function parseQuickWithPath(content: string, quickPath: string): Quick {
    const parsed = parseQuickXml(content);
    return {
      ...parsed,
      status: parsed.status as QuickStatus,
      quickPath,
    };
  }

  return {
    parseQuickXml,
    parseQuickWithPath,
  };
}
