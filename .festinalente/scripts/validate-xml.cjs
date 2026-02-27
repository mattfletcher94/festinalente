#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));
const fast_xml_parser = require_chunk.__toESM(require("fast-xml-parser"));

//#region src/scripts/validate-xml.ts
const TASKS_DIR = ".festinalente/tasks";
const QUICK_DIR = ".festinalente/quick";
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
/**
* Get XML files for a quick task.
*
* @param quickId - The quick task ID (e.g., "001").
* @returns Array of XML file paths, or null if quick task not found.
*/
function getXmlFilesForQuick(quickId) {
	const quickDir = path.default.join(QUICK_DIR, quickId);
	if (!fs.default.existsSync(quickDir) || !fs.default.statSync(quickDir).isDirectory()) return null;
	const files = [];
	const quickXml = path.default.join(quickDir, "quick.xml");
	if (fs.default.existsSync(quickXml)) files.push(quickXml);
	return files;
}
/**
* Get XML files for a full task.
*
* @param taskId - The task ID.
* @returns Array of XML file paths, or null if task not found.
*/
function getXmlFilesForTask(taskId) {
	if (taskId.startsWith("quick/")) {
		const quickId = taskId.slice(6);
		return getXmlFilesForQuick(quickId);
	}
	const taskDir = path.default.join(TASKS_DIR, taskId);
	if (!fs.default.existsSync(taskDir) || !fs.default.statSync(taskDir).isDirectory()) return null;
	const files = [];
	const xmlFiles = [
		"task.xml",
		"spec.xml",
		"plan.xml"
	];
	for (const xmlFile of xmlFiles) {
		const filePath = path.default.join(taskDir, xmlFile);
		if (fs.default.existsSync(filePath)) files.push(filePath);
	}
	return files;
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
	const args = process.argv.slice(2);
	let files;
	if (args.length > 0) {
		const taskId = args[0];
		const taskFiles = getXmlFilesForTask(taskId);
		if (taskFiles === null) {
			console.log(JSON.stringify({
				valid: false,
				error: true,
				message: `Task not found: ${taskId}`
			}));
			process.exit(1);
		}
		files = taskFiles;
	} else files = getAllXmlFiles();
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