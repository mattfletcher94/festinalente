#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));
const fast_xml_parser = require_chunk.__toESM(require("fast-xml-parser"));

//#region src/scripts/validate-xml.ts
const TASKS_DIR = ".kanban/tasks";
const parser = new fast_xml_parser.XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	allowBooleanAttributes: true
});
function validateFile(filePath) {
	try {
		const content = fs.default.readFileSync(filePath, "utf8");
		parser.parse(content);
		return null;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			file: filePath.replace(/\\/g, "/"),
			message
		};
	}
}
function getAllXmlFiles() {
	const files = [];
	if (!fs.default.existsSync(TASKS_DIR)) return files;
	const taskDirs = fs.default.readdirSync(TASKS_DIR);
	for (const dir of taskDirs) {
		const taskDir = path.default.join(TASKS_DIR, dir);
		if (!fs.default.statSync(taskDir).isDirectory()) continue;
		const xmlFiles = [
			"task.xml",
			"spec.xml",
			"plan.xml"
		];
		for (const xmlFile of xmlFiles) {
			const filePath = path.default.join(taskDir, xmlFile);
			if (fs.default.existsSync(filePath)) files.push(filePath);
		}
	}
	return files;
}
function main() {
	const files = getAllXmlFiles();
	if (files.length === 0) {
		console.log(JSON.stringify({
			valid: true,
			filesChecked: 0,
			errors: [],
			message: "No XML files found in tasks directory"
		}));
		return;
	}
	const result = {
		valid: true,
		filesChecked: files.length,
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