#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/validate-docs.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const PRODUCT_DIR = ".kanban/product";
const ENGINEERING_DIR = ".kanban/engineering";
const checks = [
	{
		name: "has-tldr",
		check: (fm) => typeof fm.tldr === "string" && fm.tldr.length > 10,
		severity: "error",
		message: "Missing or too short tldr (need >10 chars)"
	},
	{
		name: "has-summary",
		check: (fm) => typeof fm.summary === "string" && fm.summary.length > 50,
		severity: "error",
		message: "Missing or too short summary (need >50 chars)"
	},
	{
		name: "has-keywords",
		check: (fm) => Array.isArray(fm.keywords) && fm.keywords.length >= 2,
		severity: "warning",
		message: "Need at least 2 keywords for search"
	},
	{
		name: "has-overview",
		check: (_, body) => body.includes("## Overview") || body.includes("## What is this"),
		severity: "error",
		message: "Missing Overview section"
	},
	{
		name: "has-examples",
		check: (_, body) => body.includes("```") || body.includes("## Examples"),
		severity: "warning",
		message: "No code examples found"
	},
	{
		name: "has-boundaries",
		check: (fm, body) => typeof fm.boundary === "string" && fm.boundary.length > 0 || body.includes("## Boundaries") || body.includes("Does NOT"),
		severity: "warning",
		message: "No boundaries defined (helps prevent false positives in search)"
	},
	{
		name: "not-too-short",
		check: (_, body) => body.length > 300,
		severity: "warning",
		message: "Content too short (<300 chars) - may lack detail"
	},
	{
		name: "not-too-long",
		check: (_, body) => body.length < 5e3,
		severity: "warning",
		message: "Content too long (>5000 chars) - consider splitting"
	}
];
function parseArgs(args) {
	const result = { _: [] };
	for (const arg of args) if (arg.startsWith("--")) {
		const [key, value] = arg.slice(2).split("=");
		result[key] = value || true;
	} else result._.push(arg);
	return result;
}
function scanRecursive(dir) {
	if (!fs.default.existsSync(dir)) return [];
	const entries = fs.default.readdirSync(dir, { withFileTypes: true });
	let files = [];
	for (const entry of entries) {
		const fullPath = path.default.join(dir, entry.name);
		if (entry.isDirectory()) files = files.concat(scanRecursive(fullPath));
		else if (entry.name.endsWith(".md")) files.push(fullPath);
	}
	return files;
}
function validateDoc(docPath, baseDir) {
	const content = fs.default.readFileSync(docPath, "utf8");
	const { data: frontmatter, content: body } = (0, import_gray_matter.default)(content);
	const relativePath = path.default.relative(baseDir, docPath).replace(/\\/g, "/");
	let id = relativePath.replace(/\.md$/, "");
	if (id.endsWith("/index")) id = id.replace(/\/index$/, "");
	const checkResults = [];
	let hasError = false;
	let hasWarning = false;
	for (const check of checks) {
		const passed = check.check(frontmatter, body);
		checkResults.push({
			name: check.name,
			passed,
			severity: check.severity,
			message: passed ? void 0 : check.message
		});
		if (!passed) if (check.severity === "error") hasError = true;
		else hasWarning = true;
	}
	return {
		id,
		path: docPath.replace(/\\/g, "/"),
		status: hasError ? "error" : hasWarning ? "warning" : "pass",
		checks: checkResults
	};
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const typeFilter = args.type;
	const results = [];
	if (!typeFilter || typeFilter === "product") for (const docPath of scanRecursive(PRODUCT_DIR)) results.push(validateDoc(docPath, PRODUCT_DIR));
	if (!typeFilter || typeFilter === "engineering") for (const docPath of scanRecursive(ENGINEERING_DIR)) results.push(validateDoc(docPath, ENGINEERING_DIR));
	const passing = results.filter((r) => r.status === "pass").length;
	const warnings = results.filter((r) => r.status === "warning").length;
	const errors = results.filter((r) => r.status === "error").length;
	const output = {
		totalDocs: results.length,
		passing,
		warnings,
		errors,
		results
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion