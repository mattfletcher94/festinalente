#!/usr/bin/env node

// Get user-defined skills for a specific kanban command
// Usage: node get-user-skills.cjs <command>
// Example: node get-user-skills.cjs kanban-verify
// Returns JSON with skill names and paths

import fs from 'fs';
import yaml from 'js-yaml';

const CONFIG_FILE = '.kanban/config.yaml';
const SKILLS_DIR = '.claude/skills';

interface UserSkillConfig {
  skills?: string[];
}

interface Config {
  'user-skills'?: Record<string, UserSkillConfig>;
  [key: string]: unknown;
}

interface SkillInfo {
  name: string;
  path: string;
  exists: boolean;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: get-user-skills.cjs <command> (e.g., kanban-verify)'
    }));
    process.exit(1);
  }

  const command = args[0];

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

  // Get user-skills for the command
  const userSkills = config['user-skills'];
  if (!userSkills) {
    console.log(JSON.stringify({
      command: command,
      count: 0,
      skills: []
    }));
    return;
  }

  const commandConfig = userSkills[command];
  if (!commandConfig || !commandConfig.skills || commandConfig.skills.length === 0) {
    console.log(JSON.stringify({
      command: command,
      count: 0,
      skills: []
    }));
    return;
  }

  // Build skill info with paths
  const skills: SkillInfo[] = commandConfig.skills.map((skillName: string) => {
    const skillPath = `${SKILLS_DIR}/${skillName}/SKILL.md`.replace(/\\/g, '/');
    return {
      name: skillName,
      path: skillPath,
      exists: fs.existsSync(skillPath)
    };
  });

  const result = {
    command: command,
    count: skills.length,
    skills: skills
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
