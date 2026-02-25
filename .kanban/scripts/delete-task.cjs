#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-CLD-d9qv.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/delete-task.ts
const TASKS_DIR = ".kanban/tasks";
/**

* Find task file path by ID.

*

* @param id - The task ID to find.

* @returns The task file path or null if not found.

*/
function findTaskFile(id) {
	const taskPath = path.default.join(TASKS_DIR, id, "task.xml");
	if (fs.default.existsSync(taskPath)) return taskPath.replace(/\\/g, "/");
	return null;
}
/**

* Output result as JSON and exit.

*

* @param result - The result to output.

* @param exitCode - The exit code (0 for success, 1 for error).

*/
function outputResult(result, exitCode) {
	console.log(JSON.stringify(result, null, 2));
	process.exit(exitCode);
}
/**

* Main function to delete a task folder.

*/
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) outputResult({
		error: true,
		message: "Usage: delete-task.cjs <id>"
	}, 1);
	const id = args[0];
	if (!fs.default.existsSync(TASKS_DIR)) outputResult({
		error: true,
		message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
	}, 1);
	const taskPath = findTaskFile(id);
	if (!taskPath) outputResult({
		error: true,
		message: `Task ${id} not found in ${TASKS_DIR}/${id}/`
	}, 1);
	const content = fs.default.readFileSync(taskPath, "utf8");
	const parsed = require_xml_parser.parseTaskXml(content);
	const status = parsed.status;
	const title = parsed.title;
	if (status !== "backlog") outputResult({
		error: true,
		message: `Cannot delete task in ${status} status. Only backlog allowed.`
	}, 1);
	const taskFolder = path.default.join(TASKS_DIR, id);
	fs.default.rmSync(taskFolder, {
		recursive: true,
		force: true
	});
	outputResult({
		success: true,
		id,
		title,
		path: taskPath
	}, 0);
}
main();

//#endregion