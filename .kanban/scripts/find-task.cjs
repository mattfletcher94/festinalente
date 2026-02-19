#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C88XDCbK.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-task.ts
const TASKS_DIR = ".kanban/tasks";
function findTaskFile(id) {
	const taskPath = path.default.join(TASKS_DIR, id, "task.xml");
	if (fs.default.existsSync(taskPath)) return taskPath.replace(/\\/g, "/");
	return null;
}
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: find-task.cjs <id>"
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
	const taskPath = findTaskFile(id);
	if (!taskPath) {
		console.log(JSON.stringify({
			error: true,
			message: `Task ${id} not found in ${TASKS_DIR}/${id}/`
		}));
		process.exit(1);
	}
	const content = fs.default.readFileSync(taskPath, "utf8");
	const parsed = require_xml_parser.parseTaskXml(content);
	const result = {
		id,
		filename: "task.xml",
		path: taskPath,
		title: parsed.title,
		status: parsed.status,
		priority: parsed.priority,
		labels: parsed.labels
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion