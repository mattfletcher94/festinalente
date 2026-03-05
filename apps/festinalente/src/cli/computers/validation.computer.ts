/**
 * Validation computer - pure functions for validating content.
 *
 * @module cli/computers/validation
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Directive validation phases.
 */
const VALID_PHASES = ['scope', 'plan', 'implement', 'check', 'rework', 'docs', 'create', 'merge'];

/**
 * Directive validation severities.
 */
const VALID_SEVERITIES = ['error', 'warning', 'info'];

/**
 * Directive check types.
 */
const VALID_CHECK_TYPES = ['command', 'pattern', 'checklist'];

/**
 * Quality check definition.
 */
interface QualityCheck {
  readonly name: string;
  readonly check: (frontmatter: Record<string, unknown>, body: string) => boolean;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

/**
 * Documentation quality checks.
 */
const DOC_QUALITY_CHECKS: readonly QualityCheck[] = [
  {
    name: 'has-tldr',
    check: (fm) => typeof fm.tldr === 'string' && fm.tldr.length > 10,
    severity: 'error',
    message: 'Missing or too short tldr (need >10 chars)'
  },
  {
    name: 'has-summary',
    check: (fm) => typeof fm.summary === 'string' && fm.summary.length > 50,
    severity: 'error',
    message: 'Missing or too short summary (need >50 chars)'
  },
  {
    name: 'has-keywords',
    check: (fm) => Array.isArray(fm.keywords) && fm.keywords.length >= 2,
    severity: 'warning',
    message: 'Need at least 2 keywords for search'
  },
  {
    name: 'has-overview',
    check: (_, body) => body.includes('## Overview') || body.includes('## What is this'),
    severity: 'error',
    message: 'Missing Overview section'
  },
  {
    name: 'has-examples',
    check: (_, body) => body.includes('```') || body.includes('## Examples'),
    severity: 'warning',
    message: 'No code examples found'
  },
  {
    name: 'has-boundaries',
    check: (fm, body) =>
      (typeof fm.boundary === 'string' && fm.boundary.length > 0) ||
      body.includes('## Boundaries') ||
      body.includes('Does NOT'),
    severity: 'warning',
    message: 'No boundaries defined (helps prevent false positives in search)'
  },
  {
    name: 'not-too-short',
    check: (_, body) => body.length > 300,
    severity: 'warning',
    message: 'Content too short (<300 chars) - may lack detail'
  },
  {
    name: 'not-too-long',
    check: (_, body) => body.length < 5000,
    severity: 'warning',
    message: 'Content too long (>5000 chars) - consider splitting'
  }
];

/**
 * Check result for a single quality check.
 */
export interface CheckResult {
  readonly name: string;
  readonly passed: boolean;
  readonly severity: 'error' | 'warning';
  readonly message?: string;
}

/**
 * Documentation validation result.
 */
export interface DocValidationResult {
  readonly id: string;
  readonly path: string;
  readonly status: 'pass' | 'warning' | 'error';
  readonly checks: readonly CheckResult[];
}

/**
 * Validation computer interface.
 */
export interface ValidationComputer {
  /**
   * Validate XML syntax.
   *
   * @param content - The XML content to validate.
   * @returns Validation result.
   */
  readonly validateXml: (content: string) => ValidationResult;

  /**
   * Validate a directive XML file.
   *
   * @param content - The directive XML content.
   * @param expectedName - Expected directive name.
   * @returns Validation result.
   */
  readonly validateDirective: (content: string, expectedName: string) => ValidationResult;

  /**
   * Validate documentation quality.
   *
   * @param frontmatter - Parsed frontmatter.
   * @param body - Document body.
   * @param id - Document ID.
   * @param path - Document path.
   * @returns Documentation validation result.
   */
  readonly validateDocQuality: (
    frontmatter: Record<string, unknown>,
    body: string,
    id: string,
    path: string
  ) => DocValidationResult;

  /**
   * Get quality checks.
   *
   * @returns The quality checks.
   */
  readonly getQualityChecks: () => readonly QualityCheck[];
}

/**
 * Create a validation computer.
 *
 * @returns A ValidationComputer instance.
 */
export function createValidationComputer(): ValidationComputer {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text',
    isArray: (tagName) => ['principle', 'rule', 'check', 'item', 'example', 'override', 'skip'].includes(tagName)
  });

  function validateXml(content: string): ValidationResult {
    try {
      parser.parse(content);
      return { valid: true, errors: [], warnings: [] };
    } catch (err) {
      return {
        valid: false,
        errors: [err instanceof Error ? err.message : String(err)],
        warnings: []
      };
    }
  }

  function validateDirective(content: string, expectedName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: Record<string, unknown>;
    try {
      parsed = parser.parse(content);
    } catch (err) {
      return {
        valid: false,
        errors: [`XML parse error: ${err instanceof Error ? err.message : String(err)}`],
        warnings: []
      };
    }

    const directive = parsed.directive as Record<string, unknown> | undefined;
    if (!directive) {
      return { valid: false, errors: ['Missing root <directive> element'], warnings: [] };
    }

    // Validate required attributes
    const name = directive.name as string | undefined;
    const version = directive.version as string | undefined;
    const created = directive.created as string | undefined;
    const updated = directive.updated as string | undefined;

    if (!name) {
      errors.push('Missing required attribute: name');
    } else if (name !== expectedName) {
      errors.push(`Directive name "${name}" doesn't match filename "${expectedName}"`);
    }

    if (!version) errors.push('Missing required attribute: version');

    if (!created) {
      errors.push('Missing required attribute: created');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(created)) {
      errors.push(`Invalid created date format: "${created}" (expected YYYY-MM-DD)`);
    }

    if (!updated) {
      errors.push('Missing required attribute: updated');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
      errors.push(`Invalid updated date format: "${updated}" (expected YYYY-MM-DD)`);
    }

    // Collect all IDs for uniqueness check
    const allIds = new Set<string>();
    const duplicateIds: string[] = [];

    function checkId(id: string | undefined, section: string): void {
      if (!id) {
        errors.push(`Missing required id attribute in ${section}`);
        return;
      }
      if (allIds.has(id)) {
        duplicateIds.push(id);
      }
      allIds.add(id);
    }

    // Validate context section
    const context = directive.context as Record<string, unknown> | undefined;
    if (context) {
      const principles = context.principle as Array<Record<string, unknown>> | undefined;
      if (principles) {
        for (const principle of principles) {
          checkId(principle.id as string | undefined, '<context><principle>');
        }
      }
    }

    // Validate process section
    const process = directive.process as Record<string, unknown> | undefined;
    if (process) {
      const rules = process.rule as Array<Record<string, unknown>> | undefined;
      if (rules) {
        for (const rule of rules) {
          checkId(rule.id as string | undefined, '<process><rule>');

          const phase = rule.phase as string | undefined;
          if (!phase) {
            errors.push(`Missing required phase attribute in <process><rule id="${rule.id}">`);
          } else {
            const phases = phase.split(',').map((p) => p.trim());
            for (const p of phases) {
              if (!VALID_PHASES.includes(p)) {
                errors.push(`Invalid phase "${p}" in <rule id="${rule.id}">. Valid: ${VALID_PHASES.join(', ')}`);
              }
            }
          }
        }
      }
    }

    // Validate validation section
    const validation = directive.validation as Record<string, unknown> | undefined;
    if (validation) {
      const checks = validation.check as Array<Record<string, unknown>> | undefined;
      if (checks) {
        for (const check of checks) {
          checkId(check.id as string | undefined, '<validation><check>');

          const type = check.type as string | undefined;
          if (!type) {
            errors.push(`Missing required type attribute in <validation><check id="${check.id}">`);
          } else if (!VALID_CHECK_TYPES.includes(type)) {
            errors.push(
              `Invalid check type "${type}" in <check id="${check.id}">. Valid: ${VALID_CHECK_TYPES.join(', ')}`
            );
          }

          const severity = check.severity as string | undefined;
          if (!severity) {
            errors.push(`Missing required severity attribute in <validation><check id="${check.id}">`);
          } else if (!VALID_SEVERITIES.includes(severity)) {
            errors.push(
              `Invalid severity "${severity}" in <check id="${check.id}">. Valid: ${VALID_SEVERITIES.join(', ')}`
            );
          }

          // Type-specific validation
          if (type === 'command') {
            if (!check.run) errors.push(`Command check <check id="${check.id}"> missing <run> element`);
            if (!check.expect) errors.push(`Command check <check id="${check.id}"> missing <expect> element`);
          } else if (type === 'pattern') {
            if (!check.forbidden && !check.required) {
              errors.push(`Pattern check <check id="${check.id}"> needs <forbidden> or <required> element`);
            }
            if (!check.reason) errors.push(`Pattern check <check id="${check.id}"> missing <reason> element`);
            if (!check.files) {
              warnings.push(`Pattern check <check id="${check.id}"> has no files attribute (will match nothing)`);
            }
          } else if (type === 'checklist') {
            const items = check.item as Array<unknown> | undefined;
            if (!items || items.length === 0) {
              errors.push(`Checklist check <check id="${check.id}"> has no <item> elements`);
            }
          }
        }
      }
    }

    // Report duplicate IDs
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check that at least one section exists
    if (!context && !process && !validation) {
      warnings.push('Directive has no content sections (context, process, or validation)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  function validateDocQuality(
    frontmatter: Record<string, unknown>,
    body: string,
    id: string,
    path: string
  ): DocValidationResult {
    const checks: CheckResult[] = [];
    let hasError = false;
    let hasWarning = false;

    for (const check of DOC_QUALITY_CHECKS) {
      const passed = check.check(frontmatter, body);
      checks.push({
        name: check.name,
        passed,
        severity: check.severity,
        message: passed ? undefined : check.message
      });

      if (!passed) {
        if (check.severity === 'error') hasError = true;
        else hasWarning = true;
      }
    }

    return {
      id,
      path,
      status: hasError ? 'error' : hasWarning ? 'warning' : 'pass',
      checks
    };
  }

  function getQualityChecks(): readonly QualityCheck[] {
    return DOC_QUALITY_CHECKS;
  }

  return {
    validateXml,
    validateDirective,
    validateDocQuality,
    getQualityChecks
  };
}
