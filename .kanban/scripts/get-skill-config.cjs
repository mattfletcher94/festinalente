#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_js_yaml = require('./js-yaml-B0muWMf8.cjs');
const fs = require_chunk.__toESM(require("fs"));

//#region src/scripts/get-skill-config.ts
const CONFIG_FILE = ".kanban/config.yaml";
const DIRECTIVES_DIR = ".kanban/directives";
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: get-skill-config.cjs <skill> (e.g., kanban-implement)"
		}));
		process.exit(1);
	}
	const skillName = args[0];
	if (!fs.default.existsSync(CONFIG_FILE)) {
		console.log(JSON.stringify({
			error: true,
			message: `${CONFIG_FILE} not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	let config;
	try {
		const content = fs.default.readFileSync(CONFIG_FILE, "utf8");
		config = require_js_yaml.jsYaml.load(content);
	} catch (err) {
		console.log(JSON.stringify({
			error: true,
			message: `Failed to parse ${CONFIG_FILE}: ${err instanceof Error ? err.message : String(err)}`
		}));
		process.exit(1);
	}
	const directivesConfig = config.directives;
	if (!directivesConfig) {
		console.log(JSON.stringify({
			skill: skillName,
			directives: []
		}));
		return;
	}
	const skillDirectives = directivesConfig[skillName];
	if (!skillDirectives || !Array.isArray(skillDirectives)) {
		console.log(JSON.stringify({
			skill: skillName,
			directives: []
		}));
		return;
	}
	const directives = skillDirectives.map((name) => {
		const path = `${DIRECTIVES_DIR}/${name}.xml`.replace(/\\/g, "/");
		return {
			name,
			path,
			exists: fs.default.existsSync(path)
		};
	});
	const result = {
		skill: skillName,
		directives
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion