#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-task.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const TASKS_DIR = ".kanban/tasks";
function findTaskFile(id) {
	const taskPath = path.default.join(TASKS_DIR, id, "task.md");
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
	const { data: frontmatter } = (0, import_gray_matter.default)(content);
	const result = {
		id,
		filename: "task.md",
		path: taskPath,
		title: frontmatter.title || "",
		status: frontmatter.status || "",
		priority: frontmatter.priority || "",
		labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : []
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion