#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C8mdMRV3.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-task.ts
const TASKS_DIR = ".festinalente/tasks";
/**
* Find a task file by numeric prefix.
*
* @param id - The task ID (e.g., "021" or "021-some-slug").
* @returns The path and folder ID, or null if not found.
*/
function findTaskFile(id) {
	const numericMatch = id.match(/^(\d+)/);
	if (!numericMatch) return null;
	const numericPrefix = numericMatch[1];
	if (!fs.default.existsSync(TASKS_DIR)) return null;
	const folders = fs.default.readdirSync(TASKS_DIR, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name);
	for (const folder of folders) {
		const folderMatch = folder.match(/^(\d+)/);
		if (folderMatch && folderMatch[1] === numericPrefix) {
			const taskPath = path.default.join(TASKS_DIR, folder, "task.xml");
			if (fs.default.existsSync(taskPath)) return {
				path: taskPath.replace(/\\/g, "/"),
				folderId: folder
			};
		}
	}
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
	const found = findTaskFile(id);
	if (!found) {
		console.log(JSON.stringify({
			error: true,
			message: `Task ${id} not found in ${TASKS_DIR}/`
		}));
		process.exit(1);
	}
	const content = fs.default.readFileSync(found.path, "utf8");
	const parsed = require_xml_parser.parseTaskXml(content);
	const result = {
		id: found.folderId,
		filename: "task.xml",
		path: found.path,
		title: parsed.title,
		status: parsed.status,
		priority: parsed.priority,
		labels: parsed.labels
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion