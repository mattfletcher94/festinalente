#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/validate-yaml.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const TASKS_DIR = ".festinalente/tasks";
/**
* Validate a single markdown file.
*/
function validateFile(filePath) {
	try {
		const content = fs.default.readFileSync(filePath, "utf8");
		(0, import_gray_matter.default)(content);
		return null;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			file: filePath,
			message
		};
	}
}
/**
* Get all markdown files in the tasks directory.
*/
function getAllTaskFiles() {
	const files = [];
	if (!fs.default.existsSync(TASKS_DIR)) return files;
	const taskDirs = fs.default.readdirSync(TASKS_DIR);
	for (const dir of taskDirs) {
		const taskDir = path.default.join(TASKS_DIR, dir);
		if (!fs.default.statSync(taskDir).isDirectory()) continue;
		const mdFiles = [
			"task.md",
			"spec.md",
			"plan.md"
		];
		for (const mdFile of mdFiles) {
			const filePath = path.default.join(taskDir, mdFile);
			if (fs.default.existsSync(filePath)) files.push(filePath.replace(/\\/g, "/"));
		}
	}
	return files;
}
function main() {
	if (!fs.default.existsSync(TASKS_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${TASKS_DIR}/ directory not found.`
		}));
		process.exit(1);
	}
	const files = getAllTaskFiles();
	const result = {
		valid: true,
		errors: []
	};
	for (const file of files) {
		const error = validateFile(file);
		if (error) result.errors.push(error);
	}
	result.valid = result.errors.length === 0;
	console.log(JSON.stringify(result, null, 2));
	if (!result.valid) process.exit(1);
}
main();

//#endregion