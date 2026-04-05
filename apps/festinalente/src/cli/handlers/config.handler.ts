/**
 * Config handler - commands for configuration and utility operations.
 *
 * @module cli/handlers/config
 */

import type { CliCommand, CliResult } from '../types';
import { error, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { YamlParserComputer } from '../computers/yaml-parser.computer';
import { defineCommand } from '../registry';

const CONFIG_FILE = '.festinalente/config.yaml';
const DIRECTIVES_DIR = '.festinalente/directives';
const GLOSSARY_FILE = '.festinalente/glossary.yaml';

/**
 * Directive info for skill config.
 */
export interface DirectiveInfo {
  readonly name: string;
  readonly path: string;
  readonly exists: boolean;
}

/**
 * Skill config result.
 */
export interface SkillConfigResult {
  readonly skill: string;
  readonly directives: readonly DirectiveInfo[];
}

/**
 * Date time result.
 */
export interface DateTimeResult {
  readonly iso: string;
  readonly date: string;
}

/**
 * Glossary term.
 */
export interface GlossaryTerm {
  readonly term: string;
  readonly aliases: readonly string[];
  readonly domain?: string;
  readonly definition?: string;
}

/**
 * Glossary match.
 */
export interface GlossaryMatch {
  readonly term: string;
  readonly matchedOn: string;
  readonly aliases: readonly string[];
}

/**
 * Expand query result.
 */
export interface ExpandQueryResult {
  readonly original: readonly string[];
  readonly expanded: readonly string[];
  readonly glossaryMatches: readonly GlossaryMatch[];
}

/**
 * Dependencies for config handler.
 */
export interface ConfigHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
}

/**
 * Config handler interface.
 */
export interface ConfigHandler {
  readonly getSkillConfig: (args: string[]) => CliResult<SkillConfigResult>;
  readonly getDateTime: (args: string[]) => CliResult<DateTimeResult>;
  readonly expandQuery: (args: string[]) => CliResult<ExpandQueryResult>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a config handler.
 *
 * @param deps - The dependencies.
 * @returns A ConfigHandler instance.
 */
export function createConfigHandler(deps: ConfigHandlerDeps): ConfigHandler {
  const { fs, yamlParser } = deps;

  /**
   * Get skill config command.
   */
  function getSkillConfig(args: string[]): CliResult<SkillConfigResult> {
    const parsed = parseArgs(args);

    if (parsed.positional.length === 0) {
      return error('Usage: get-skill-config <skill> (e.g., festina-implement)');
    }

    const skillName = parsed.positional[0];

    if (!fs.exists(CONFIG_FILE)) {
      return error(`${CONFIG_FILE} not found. Run npx festinalente first.`);
    }

    const readResult = fs.readFile(CONFIG_FILE);
    if (!readResult.ok) {
      return error(`Failed to read ${CONFIG_FILE}: ${readResult.error.message}`);
    }

    let config: Record<string, unknown>;
    try {
      config = yamlParser.parseYaml(readResult.value) as Record<string, unknown>;
    } catch (err) {
      return error(`Failed to parse ${CONFIG_FILE}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Get directives configuration
    const directivesConfig = config.directives as Record<string, string[]> | undefined;
    if (!directivesConfig) {
      return success({
        skill: skillName,
        directives: []
      });
    }

    const skillDirectives = directivesConfig[skillName];
    if (!skillDirectives || !Array.isArray(skillDirectives)) {
      return success({
        skill: skillName,
        directives: []
      });
    }

    // Build directives info
    const directives: DirectiveInfo[] = skillDirectives.map((name: string) => {
      const path = fs.joinPath(DIRECTIVES_DIR, `${name}.xml`).replace(/\\/g, '/');
      return {
        name,
        path,
        exists: fs.exists(path)
      };
    });

    return success({
      skill: skillName,
      directives
    });
  }

  /**
   * Get date time command.
   */
  function getDateTime(_args: string[]): CliResult<DateTimeResult> {
    const now = new Date();

    return success({
      iso: now.toISOString(),
      date: now.toISOString().split('T')[0]
    });
  }

  /**
   * Load glossary from file.
   */
  function loadGlossary(): { terms: GlossaryTerm[] } | null {
    if (!fs.exists(GLOSSARY_FILE)) {
      return null;
    }

    const readResult = fs.readFile(GLOSSARY_FILE);
    if (!readResult.ok) {
      return null;
    }

    try {
      return yamlParser.parseYaml(readResult.value) as { terms: GlossaryTerm[] };
    } catch {
      return null;
    }
  }

  /**
   * Expand query using glossary.
   */
  function expandQuery(args: string[]): CliResult<ExpandQueryResult> {
    const parsed = parseArgs(args);
    const terms = parsed.positional;

    if (terms.length === 0) {
      return error('Usage: expand-query keyword1 keyword2 ...');
    }

    const glossary = loadGlossary();

    if (!glossary || !glossary.terms || glossary.terms.length === 0) {
      return success({
        original: terms,
        expanded: terms,
        glossaryMatches: []
      });
    }

    const expanded = new Set<string>();
    const matches: GlossaryMatch[] = [];

    // Add all original terms
    for (const term of terms) {
      expanded.add(term.toLowerCase());
    }

    // Check each term against glossary
    for (const term of terms) {
      const termLower = term.toLowerCase();

      for (const entry of glossary.terms) {
        const entryTermLower = entry.term.toLowerCase();
        const aliasesLower = entry.aliases.map((a) => a.toLowerCase());

        // Check if term matches the glossary term or any alias
        if (termLower === entryTermLower || aliasesLower.includes(termLower)) {
          // Add the main term and all aliases
          expanded.add(entryTermLower);
          for (const alias of entry.aliases) {
            expanded.add(alias.toLowerCase());
          }

          matches.push({
            term: entry.term,
            matchedOn: term,
            aliases: entry.aliases
          });
        }
      }
    }

    return success({
      original: terms,
      expanded: Array.from(expanded),
      glossaryMatches: matches
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'get-skill-config',
        'Get skill configuration and directives',
        'get-skill-config <skill>',
        getSkillConfig
      ),
      defineCommand('get-date-time', 'Get formatted date-time strings', 'get-date-time', getDateTime),
      defineCommand(
        'expand-query',
        'Expand search query using glossary',
        'expand-query keyword1 keyword2 ...',
        expandQuery
      )
    ];
  }

  return {
    getSkillConfig,
    getDateTime,
    expandQuery,
    getCommands
  };
}
