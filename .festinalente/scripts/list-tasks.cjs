#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C8mdMRV3.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/list-tasks.ts
const TASKS_DIR = ".festinalente/tasks";
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
		const filePath = path.default.join(TASKS_DIR, folderId, "task.xml").replace(/\\/g, "/");
		if (!fs.default.existsSync(filePath)) continue;
		const content = fs.default.readFileSync(filePath, "utf8");
		const parsed = require_xml_parser.parseTaskXml(content);
		const task = {
			id: folderId,
			filename: "task.xml",
			path: filePath,
			title: parsed.title,
			status: parsed.status,
			priority: parsed.priority,
			labels: parsed.labels
		};
		if (args.status && task.status !== args.status) continue;
		if (args["exclude-status"] && task.status === args["exclude-status"]) continue;
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