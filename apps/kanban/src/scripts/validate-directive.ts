#!/usr/bin/env node

// Validate a directive XML file
// Usage: node validate-directive.cjs <directive-name>
// Example: node validate-directive.cjs architecture
// Returns JSON: { valid: boolean, errors: string[] }

import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

const DIRECTIVES_DIR = '.kanban/directives';

const VALID_PHASES = ['scope', 'plan', 'implement', 'codecheck', 'rework', 'docs'];
const VALID_SEVERITIES = ['error', 'warning', 'info'];
const VALID_CHECK_TYPES = ['command', 'pattern', 'checklist'];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({
      valid: false,
      errors: ['Usage: validate-directive.cjs <directive-name>'],
      warnings: []
    }));
    process.exit(1);
  }

  const directiveName = args[0];
  const filePath = `${DIRECTIVES_DIR}/${directiveName}.xml`;

  if (!fs.existsSync(filePath)) {
    console.log(JSON.stringify({
      valid: false,
      errors: [`Directive file not found: ${filePath}`],
      warnings: []
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const result = validateDirective(content, directiveName);

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

function validateDirective(content: string, expectedName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse XML
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '_text',
    isArray: (tagName) => ['principle', 'rule', 'check', 'item', 'example'].includes(tagName)
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(content);
  } catch (err) {
    errors.push(`XML parse error: ${err instanceof Error ? err.message : String(err)}`);
    return { valid: false, errors, warnings };
  }

  // Check for root <directive> element
  const directive = parsed.directive as Record<string, unknown> | undefined;
  if (!directive) {
    errors.push('Missing root <directive> element');
    return { valid: false, errors, warnings };
  }

  // Validate required attributes on <directive>
  const name = directive.name as string | undefined;
  const version = directive.version as string | undefined;
  const created = directive.created as string | undefined;
  const updated = directive.updated as string | undefined;

  if (!name) {
    errors.push('Missing required attribute: name');
  } else if (name !== expectedName) {
    errors.push(`Directive name "${name}" doesn't match filename "${expectedName}"`);
  }

  if (!version) {
    errors.push('Missing required attribute: version');
  }

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

  // Validate <context> section
  const context = directive.context as Record<string, unknown> | undefined;
  if (context) {
    const principles = context.principle as Array<Record<string, unknown>> | undefined;
    if (principles) {
      for (const principle of principles) {
        checkId(principle.id as string | undefined, '<context><principle>');
      }
    }
  }

  // Validate <process> section
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
          // Phase can be comma-separated list
          const phases = phase.split(',').map(p => p.trim());
          for (const p of phases) {
            if (!VALID_PHASES.includes(p)) {
              errors.push(`Invalid phase "${p}" in <rule id="${rule.id}">. Valid: ${VALID_PHASES.join(', ')}`);
            }
          }
        }
      }
    }
  }

  // Validate <validation> section
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
          errors.push(`Invalid check type "${type}" in <check id="${check.id}">. Valid: ${VALID_CHECK_TYPES.join(', ')}`);
        }

        const severity = check.severity as string | undefined;
        if (!severity) {
          errors.push(`Missing required severity attribute in <validation><check id="${check.id}">`);
        } else if (!VALID_SEVERITIES.includes(severity)) {
          errors.push(`Invalid severity "${severity}" in <check id="${check.id}">. Valid: ${VALID_SEVERITIES.join(', ')}`);
        }

        // Type-specific validation
        if (type === 'command') {
          if (!check.run) {
            errors.push(`Command check <check id="${check.id}"> missing <run> element`);
          }
          if (!check.expect) {
            errors.push(`Command check <check id="${check.id}"> missing <expect> element`);
          }
        } else if (type === 'pattern') {
          if (!check.forbidden && !check.required) {
            errors.push(`Pattern check <check id="${check.id}"> needs <forbidden> or <required> element`);
          }
          if (!check.reason) {
            errors.push(`Pattern check <check id="${check.id}"> missing <reason> element`);
          }
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

  // Validate <examples> section
  const examples = directive.examples as Record<string, unknown> | undefined;
  if (examples) {
    const exampleList = examples.example as Array<Record<string, unknown>> | undefined;
    if (exampleList) {
      for (const example of exampleList) {
        const ref = example.ref as string | undefined;
        const type = example.type as string | undefined;

        if (ref && !allIds.has(ref)) {
          warnings.push(`Example ref="${ref}" doesn't match any rule/check ID`);
        }

        if (type && !['correct', 'violation'].includes(type)) {
          errors.push(`Invalid example type "${type}". Valid: correct, violation`);
        }
      }
    }
  }

  // Report duplicate IDs
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
  }

  // Check that at least one section exists
  if (!context && !process && !validation && !examples) {
    warnings.push('Directive has no content sections (context, process, validation, or examples)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

main();
