#!/usr/bin/env node

// Get hook configuration for a specific kanban command
// Usage: node get-hook-config.cjs <hook>
// Example: node get-hook-config.cjs kanban-codecheck
// Returns JSON with directives, product docs, and engineering docs

import fs from 'fs';
import yaml from 'js-yaml';

const CONFIG_FILE = '.kanban/config.yaml';
const DIRECTIVES_DIR = '.kanban/directives';
const PRODUCT_DIR = '.kanban/product';
const ENGINEERING_DIR = '.kanban/engineering';

interface HookConfig {
  directives?: string[];
  product?: string[];
  engineering?: string[];
}

interface Config {
  hooks?: Record<string, HookConfig>;
  [key: string]: unknown;
}

interface DirectiveInfo {
  name: string;
  path: string;
  exists: boolean;
}

interface DocInfo {
  id: string;
  path: string;
  exists: boolean;
}

interface HookResult {
  hook: string;
  directives: DirectiveInfo[];
  product: DocInfo[];
  engineering: DocInfo[];
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: get-hook-config.cjs <hook> (e.g., kanban-codecheck)'
    }));
    process.exit(1);
  }

  const hookName = args[0];

  if (!fs.existsSync(CONFIG_FILE)) {
    console.log(JSON.stringify({
      error: true,
      message: `${CONFIG_FILE} not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  // Parse config.yaml
  let config: Config;
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = yaml.load(content) as Config;
  } catch (err) {
    console.log(JSON.stringify({
      error: true,
      message: `Failed to parse ${CONFIG_FILE}: ${err instanceof Error ? err.message : String(err)}`
    }));
    process.exit(1);
  }

  // Get hooks configuration
  const hooks = config.hooks;
  if (!hooks) {
    console.log(JSON.stringify({
      hook: hookName,
      directives: [],
      product: [],
      engineering: []
    } as HookResult));
    return;
  }

  const hookConfig = hooks[hookName];
  if (!hookConfig) {
    console.log(JSON.stringify({
      hook: hookName,
      directives: [],
      product: [],
      engineering: []
    } as HookResult));
    return;
  }

  // Build directives info
  const directives: DirectiveInfo[] = (hookConfig.directives || []).map((name: string) => {
    const path = `${DIRECTIVES_DIR}/${name}/DIRECTIVE.md`.replace(/\\/g, '/');
    return {
      name,
      path,
      exists: fs.existsSync(path)
    };
  });

  // Build product docs info
  const product: DocInfo[] = (hookConfig.product || []).map((id: string) => {
    const path = `${PRODUCT_DIR}/${id}.md`.replace(/\\/g, '/');
    return {
      id,
      path,
      exists: fs.existsSync(path)
    };
  });

  // Build engineering docs info
  const engineering: DocInfo[] = (hookConfig.engineering || []).map((id: string) => {
    const path = `${ENGINEERING_DIR}/${id}.md`.replace(/\\/g, '/');
    return {
      id,
      path,
      exists: fs.existsSync(path)
    };
  });

  const result: HookResult = {
    hook: hookName,
    directives,
    product,
    engineering
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
