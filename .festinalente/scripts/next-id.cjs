#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));

//#region src/scripts/next-id.ts
const TASKS_DIR = ".kanban/tasks";
const CONFIG_FILE = ".kanban/config.yaml";
function parseSimpleYaml(content) {
	const result = {};
	const lines = content.split("\n");
	for (const line of lines) {
		const match = line.match(/^(\w+):\s*(.*)$/);
		if (match) {
			let value = match[2].trim();
			if (value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1);
			else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
			const num = parseInt(value, 10);
			result[match[1]] = isNaN(num) ? value : num;
		}
	}
	return result;
}
function main() {
	let padding = 3;
	if (fs.default.existsSync(CONFIG_FILE)) try {
		const content = fs.default.readFileSync(CONFIG_FILE, "utf8");
		const config = parseSimpleYaml(content);
		if (config.idPadding) padding = config.idPadding;
	} catch {}
	if (!fs.default.existsSync(TASKS_DIR)) {
		const result$1 = {
			nextId: "1".padStart(padding, "0"),
			currentHighest: null,
			padding
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	const folders = fs.default.readdirSync(TASKS_DIR, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name);
	if (folders.length === 0) {
		const result$1 = {
			nextId: "1".padStart(padding, "0"),
			currentHighest: null,
			padding
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	let highest = 0;
	for (const folderName of folders) {
		const id = parseInt(folderName, 10);
		if (!isNaN(id) && id > highest) highest = id;
	}
	const nextId = (highest + 1).toString().padStart(padding, "0");
	const currentHighest = highest.toString().padStart(padding, "0");
	const result = {
		nextId,
		currentHighest,
		padding
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion