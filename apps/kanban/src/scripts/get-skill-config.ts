#!/usr/bin/env node

// Get skill configuration for a specific kanban command
// Usage: node get-skill-config.cjs <skill>
// Example: node get-skill-config.cjs kanban-implement
// Returns JSON with directives for the skill

import fs from 'fs';
import yaml from 'js-yaml';

const CONFIG_FILE = '.kanban/config.yaml';
const DIRECTIVES_DIR = '.kanban/directives';

interface Config {
  directives?: Record<string, string[]>;
  [key: string]: unknown;
}

interface DirectiveInfo {
  name: string;
  path: string;
  exists: boolean;
}

interface SkillResult {
  skill: string;
  directives: DirectiveInfo[];
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: get-skill-config.cjs <skill> (e.g., kanban-implement)'
    }));
    process.exit(1);
  }

  const skillName = args[0];

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

  // Get directives configuration
  const directivesConfig = config.directives;
  if (!directivesConfig) {
    console.log(JSON.stringify({
      skill: skillName,
      directives: []
    } as SkillResult));
    return;
  }

  const skillDirectives = directivesConfig[skillName];
  if (!skillDirectives || !Array.isArray(skillDirectives)) {
    console.log(JSON.stringify({
      skill: skillName,
      directives: []
    } as SkillResult));
    return;
  }

  // Build directives info
  const directives: DirectiveInfo[] = skillDirectives.map((name: string) => {
    const path = `${DIRECTIVES_DIR}/${name}.xml`.replace(/\\/g, '/');
    return {
      name,
      path,
      exists: fs.existsSync(path)
    };
  });

  const result: SkillResult = {
    skill: skillName,
    directives
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
