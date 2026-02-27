#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));
const slugify = require_chunk.__toESM(require("slugify"));

//#region src/scripts/next-id.ts
const TASKS_DIR = ".festinalente/tasks";
const CONFIG_FILE = ".festinalente/config.yaml";
const MAX_SLUG_LENGTH = 50;
/**
* Parse simple YAML config (key: value pairs).
*
* @param content - The YAML content to parse.
* @returns Parsed key-value pairs.
*/
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
/**
* Parse the --title argument from process.argv.
*
* @returns The title string or null if not provided.
*/
function parseTitleArg() {
	const titleArg = process.argv.find((arg) => arg.startsWith("--title="));
	if (!titleArg) return null;
	return titleArg.slice(8);
}
/**
* Extract the numeric prefix from a folder name.
* Handles both "021" and "021-slug-here" formats.
*
* @param folderName - The folder name to parse.
* @returns The numeric ID or null if not a valid folder.
*/
function extractNumericId(folderName) {
	const match = folderName.match(/^(\d+)/);
	if (match) {
		const id = parseInt(match[1], 10);
		if (!isNaN(id)) return id;
	}
	return null;
}
function main() {
	const title = parseTitleArg();
	if (!title) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: next-id.cjs --title=\"Task title\""
		}));
		process.exit(1);
	}
	let padding = 3;
	if (fs.default.existsSync(CONFIG_FILE)) try {
		const content = fs.default.readFileSync(CONFIG_FILE, "utf8");
		const config = parseSimpleYaml(content);
		if (config.idPadding) padding = config.idPadding;
	} catch {}
	const slug = (0, slugify.default)(title, {
		lower: true,
		strict: true
	}).slice(0, MAX_SLUG_LENGTH);
	if (!fs.default.existsSync(TASKS_DIR)) {
		const paddedNumber$1 = "1".padStart(padding, "0");
		const nextId$1 = `${paddedNumber$1}-${slug}`;
		const result$1 = {
			nextId: nextId$1,
			currentHighest: null,
			padding,
			slug
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	const folders = fs.default.readdirSync(TASKS_DIR, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name);
	if (folders.length === 0) {
		const paddedNumber$1 = "1".padStart(padding, "0");
		const nextId$1 = `${paddedNumber$1}-${slug}`;
		const result$1 = {
			nextId: nextId$1,
			currentHighest: null,
			padding,
			slug
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	let highest = 0;
	for (const folderName of folders) {
		const id = extractNumericId(folderName);
		if (id !== null && id > highest) highest = id;
	}
	const paddedNumber = (highest + 1).toString().padStart(padding, "0");
	const nextId = `${paddedNumber}-${slug}`;
	const currentHighest = highest.toString().padStart(padding, "0");
	const result = {
		nextId,
		currentHighest,
		padding,
		slug
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion