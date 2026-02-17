#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/list-tasks.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const TASKS_DIR = ".kanban/tasks";
function parseArgs(args) {
	const result = { _: [] };
	for (const arg of args) if (arg.startsWith("--")) {
		const [key, value] = arg.slice(2).split("=");
		result[key] = value || true;
	} else result._.push(arg);
	return result;
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!fs.default.existsSync(TASKS_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	const folders = fs.default.readdirSync(TASKS_DIR, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name).sort();
	const tasks = [];
	for (const folderId of folders) {
		const filePath = path.default.join(TASKS_DIR, folderId, "task.md").replace(/\\/g, "/");
		if (!fs.default.existsSync(filePath)) continue;
		const content = fs.default.readFileSync(filePath, "utf8");
		const { data: frontmatter } = (0, import_gray_matter.default)(content);
		const task = {
			id: folderId,
			filename: "task.md",
			path: filePath,
			title: frontmatter.title || "",
			status: frontmatter.status || "",
			priority: frontmatter.priority || "",
			labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : []
		};
		if (args.status && task.status !== args.status) continue;
		if (args.priority && task.priority !== args.priority) continue;
		if (args.label && !task.labels.includes(args.label)) continue;
		tasks.push(task);
	}
	const result = {
		count: tasks.length,
		tasks
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion