/**
 * Directive validator computer - pure functions for validating directive XML files.
 */

import type { DirectiveValidationError, DirectiveValidationResult } from '../types/directives-types';
import { XMLParser } from 'fast-xml-parser';

/**
 * Valid phases for directive rules.
 */
const VALID_PHASES = [
  'scope',
  'plan',
  'implement',
  'check',
  'rework',
  'docs',
  'create',
  'merge',
  'save',
  'finalize',
  'delete',
  'quick',
  'define-product',
  'map-product',
  'map-engineering',
  'directive'
] as const;

/**
 * Valid severity levels for directive checks.
 */
const VALID_SEVERITIES = ['error', 'warning', 'info'] as const;

/**
 * Valid check types for directive validation checks.
 */
const VALID_CHECK_TYPES = ['command', 'pattern', 'checklist'] as const;

/**
 * Return type for the directive validator computer factory.
 */
export interface CreateDirectiveValidatorComputerReturn {
  /**
   * Validate a directive XML string against expected structure and naming.
   *
   * @param content - The raw XML content of the directive file
   * @param expectedName - The expected directive name (derived from filename)
   * @returns Structured validation result with element-level error context
   */
  validateDirective(content: string, expectedName: string): DirectiveValidationResult;
}

/**
 * Create a directive validator computer with pure validation functions.
 *
 * @returns An object containing directive validation functions
 */
export function createDirectiveValidatorComputer(): CreateDirectiveValidatorComputerReturn {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text',
    isArray: (tagName: string) =>
      ['principle', 'rule', 'check', 'item', 'example', 'override', 'skip'].includes(tagName)
  });

  /**
   * Validate a directive XML string against expected structure and naming.
   *
   * @param content - The raw XML content of the directive file
   * @param expectedName - The expected directive name (derived from filename)
   * @returns Structured validation result with element-level error context
   */
  function validateDirective(content: string, expectedName: string): DirectiveValidationResult {
    const errors: DirectiveValidationError[] = [];

    function addError(
      message: string,
      severity: DirectiveValidationError['severity'],
      elementTag: string,
      elementId: string | undefined,
      elementIndex?: number | undefined
    ): void {
      errors.push({ message, severity, elementTag, elementId, elementIndex });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parser.parse(content) as Record<string, unknown>;
    } catch (err) {
      return {
        valid: false,
        errors: [
          {
            message: `XML parse error: ${err instanceof Error ? err.message : String(err)}`,
            severity: 'error',
            elementTag: 'directive',
            elementId: undefined,
            elementIndex: undefined
          }
        ]
      };
    }

    const directive = parsed['directive'] as Record<string, unknown> | undefined;
    if (!directive) {
      return {
        valid: false,
        errors: [
          {
            message: 'Missing root <directive> element',
            severity: 'error',
            elementTag: 'directive',
            elementId: undefined,
            elementIndex: undefined
          }
        ]
      };
    }

    // Validate required attributes
    const name = directive['name'] as string | undefined;
    const version = directive['version'] as string | undefined;
    const created = directive['created'] as string | undefined;
    const updated = directive['updated'] as string | undefined;

    if (!name) {
      addError('Missing required attribute: name', 'error', 'directive', undefined);
    } else if (name !== expectedName) {
      addError(`Directive name "${name}" doesn't match filename "${expectedName}"`, 'error', 'directive', undefined);
    }

    if (!version) {
      addError('Missing required attribute: version', 'error', 'directive', undefined);
    }

    if (!created) {
      addError('Missing required attribute: created', 'error', 'directive', undefined);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(created)) {
      addError(`Invalid created date format: "${created}" (expected YYYY-MM-DD)`, 'error', 'directive', undefined);
    }

    if (!updated) {
      addError('Missing required attribute: updated', 'error', 'directive', undefined);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
      addError(`Invalid updated date format: "${updated}" (expected YYYY-MM-DD)`, 'error', 'directive', undefined);
    }

    // Collect all IDs for uniqueness check
    const allIds = new Map<string, string>();
    const duplicateIds: Array<{ readonly id: string; readonly elementTag: string }> = [];

    function checkId(id: string | undefined, elementTag: string, elementIndex: number): void {
      if (!id) {
        addError(`Missing required id attribute in <${elementTag}>`, 'error', elementTag, undefined, elementIndex);
        return;
      }
      if (allIds.has(id)) {
        duplicateIds.push({ id, elementTag });
      }
      allIds.set(id, elementTag);
    }

    // Validate context section
    const context = directive['context'] as Record<string, unknown> | undefined;
    if (context) {
      const principles = context['principle'] as Array<Record<string, unknown>> | undefined;
      if (principles) {
        for (let i = 0; i < principles.length; i++) {
          checkId(principles[i]['id'] as string | undefined, 'principle', i);
        }
      }
    }

    // Validate process section
    const process = directive['process'] as Record<string, unknown> | undefined;
    if (process) {
      const rules = process['rule'] as Array<Record<string, unknown>> | undefined;
      if (rules) {
        for (let ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
          const rule = rules[ruleIdx];
          const ruleId = rule['id'] as string | undefined;
          checkId(ruleId, 'rule', ruleIdx);

          const phase = rule['phase'] as string | undefined;
          if (!phase) {
            addError(`Missing required phase attribute in <rule id="${ruleId ?? ''}">`, 'error', 'rule', ruleId);
          } else {
            const phases = phase.split(',').map((p) => p.trim());
            for (const p of phases) {
              if (!(VALID_PHASES as readonly string[]).includes(p)) {
                addError(
                  `Invalid phase "${p}" in <rule id="${ruleId ?? ''}">. Valid: ${VALID_PHASES.join(', ')}`,
                  'warning',
                  'rule',
                  ruleId
                );
              }
            }
          }
        }
      }
    }

    // Validate validation section
    const validation = directive['validation'] as Record<string, unknown> | undefined;
    if (validation) {
      const checks = validation['check'] as Array<Record<string, unknown>> | undefined;
      if (checks) {
        for (let checkIdx = 0; checkIdx < checks.length; checkIdx++) {
          const check = checks[checkIdx];
          const checkId_ = check['id'] as string | undefined;
          checkId(checkId_, 'check', checkIdx);

          const type = check['type'] as string | undefined;
          if (!type) {
            addError(`Missing required type attribute in <check id="${checkId_ ?? ''}">`, 'error', 'check', checkId_);
          } else if (!(VALID_CHECK_TYPES as readonly string[]).includes(type)) {
            addError(
              `Invalid check type "${type}" in <check id="${checkId_ ?? ''}">. Valid: ${VALID_CHECK_TYPES.join(', ')}`,
              'warning',
              'check',
              checkId_
            );
          }

          const severity = check['severity'] as string | undefined;
          if (!severity) {
            addError(
              `Missing required severity attribute in <check id="${checkId_ ?? ''}">`,
              'error',
              'check',
              checkId_
            );
          } else if (!(VALID_SEVERITIES as readonly string[]).includes(severity)) {
            addError(
              `Invalid severity "${severity}" in <check id="${checkId_ ?? ''}">. Valid: ${VALID_SEVERITIES.join(', ')}`,
              'warning',
              'check',
              checkId_
            );
          }

          // Type-specific validation
          if (type === 'command') {
            if (!check['run']) {
              addError(
                `Command check <check id="${checkId_ ?? ''}"> missing <run> element`,
                'error',
                'check',
                checkId_
              );
            }
            if (!check['expect']) {
              addError(
                `Command check <check id="${checkId_ ?? ''}"> missing <expect> element`,
                'error',
                'check',
                checkId_
              );
            }
          } else if (type === 'pattern') {
            if (!check['forbidden'] && !check['required']) {
              addError(
                `Pattern check <check id="${checkId_ ?? ''}"> needs <forbidden> or <required> element`,
                'error',
                'check',
                checkId_
              );
            }
            if (!check['reason']) {
              addError(
                `Pattern check <check id="${checkId_ ?? ''}"> missing <reason> element`,
                'error',
                'check',
                checkId_
              );
            }
          } else if (type === 'checklist') {
            const items = check['item'] as Array<unknown> | undefined;
            if (!items || items.length === 0) {
              addError(
                `Checklist check <check id="${checkId_ ?? ''}"> has no <item> elements`,
                'error',
                'check',
                checkId_
              );
            }
          }
        }
      }
    }

    // Report duplicate IDs
    for (const dup of duplicateIds) {
      addError(`Duplicate ID found: "${dup.id}"`, 'error', dup.elementTag, dup.id);
    }

    const hasErrors = errors.some((e) => e.severity === 'error');
    return { valid: !hasErrors, errors };
  }

  return {
    validateDirective
  };
}
