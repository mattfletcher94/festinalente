/**
 * Directives config computer - pure functions for parsing config.yaml directives section.
 */

import * as yaml from 'js-yaml';
import type { Directive, DirectiveId, Workflow, WorkflowId } from '../types/directives-types';

/**
 * Structure of the directives section in config.yaml.
 */
interface ConfigYaml {
  directives?: Record<string, string[] | null>;
}

/**
 * Return type for the directives config computer factory.
 */
export interface CreateDirectivesConfigComputerReturn {
  /**
   * Parse config.yaml content and extract workflow-directive mappings.
   *
   * @param content - Raw config.yaml file content.
   * @param directivesDir - Path to the directives folder.
   * @param checkExists - Function to check if a file exists.
   * @returns Array of workflows with their assigned directives.
   */
  parseConfig(content: string, directivesDir: string, checkExists: (path: string) => boolean): Workflow[];

  /**
   * Format a skill ID as a display name.
   *
   * @param skillId - The skill ID (e.g., "festina-scope").
   * @returns Formatted display name (e.g., "Scope").
   */
  formatWorkflowName(skillId: string): string;
}

/**
 * Create a directives config computer for parsing config.yaml.
 *
 * @returns Directives config computer with parsing functions.
 */
export function createDirectivesConfigComputer(): CreateDirectivesConfigComputerReturn {
  /**
   * Format a skill ID as a display name by stripping "festina-" prefix and capitalizing.
   */
  function formatWorkflowName(skillId: string): string {
    const name = skillId.replace(/^festina-/, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Parse config.yaml content and extract workflow-directive mappings.
   */
  function parseConfig(content: string, directivesDir: string, checkExists: (path: string) => boolean): Workflow[] {
    const workflows: Workflow[] = [];

    try {
      const config = yaml.load(content) as ConfigYaml;

      if (!config?.directives) {
        return workflows;
      }

      for (const [skillId, directiveNames] of Object.entries(config.directives)) {
        const directives: Directive[] = (directiveNames ?? []).map((name) => {
          const path = `${directivesDir}/${name}.xml`;
          return {
            id: name as DirectiveId,
            name,
            path,
            exists: checkExists(path)
          };
        });

        workflows.push({
          id: skillId as WorkflowId,
          displayName: formatWorkflowName(skillId),
          directives
        });
      }
    } catch {
      // Return empty array if YAML parsing fails
      return workflows;
    }

    return workflows;
  }

  return {
    parseConfig,
    formatWorkflowName
  };
}
