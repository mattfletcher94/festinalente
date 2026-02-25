#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C8mdMRV3.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-spec.ts
const TASKS_DIR = ".kanban/tasks";
function findSpecFile(id) {
	const specPath = path.default.join(TASKS_DIR, id, "spec.xml");
	if (fs.default.existsSync(specPath)) return specPath.replace(/\\/g, "/");
	return null;
}
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: find-spec.cjs <id>"
		}));
		process.exit(1);
	}
	const id = args[0];
	if (!fs.default.existsSync(TASKS_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	const specPath = findSpecFile(id);
	if (!specPath) {
		console.log(JSON.stringify({
			error: true,
			message: `Spec for task ${id} not found in ${TASKS_DIR}/${id}/`
		}));
		process.exit(1);
	}
	const content = fs.default.readFileSync(specPath, "utf8");
	const parsed = require_xml_parser.parseSpecXml(content);
	const result = {
		id,
		filename: "spec.xml",
		path: specPath,
		task: parsed.task || id,
		created: parsed.created,
		updated: parsed.updated
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion