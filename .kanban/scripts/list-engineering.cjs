#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/list-engineering.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const ENGINEERING_DIR = ".kanban/engineering";
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
function deriveIdAndSystem(filePath, engineeringDir) {
	const relativePath = path.default.relative(engineeringDir, filePath).replace(/\\/g, "/");
	const withoutExt = relativePath.replace(/\.md$/, "");
	const parts = withoutExt.split("/");
	if (parts.length === 1) return {
		id: parts[0],
		system: null
	};
	if (parts[0] === "systems") {
		if (parts.length === 3 && parts[2] === "index") return {
			id: `${parts[0]}/${parts[1]}`,
			system: null
		};
		else if (parts.length === 3) return {
			id: withoutExt,
			system: parts[1]
		};
		else if (parts.length === 2) return {
			id: withoutExt,
			system: null
		};
	}
	return {
		id: withoutExt,
		system: null
	};
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!fs.default.existsSync(ENGINEERING_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${ENGINEERING_DIR}/ directory not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	const files = scanRecursive(ENGINEERING_DIR).sort();
	const docs = [];
	for (const filePath of files) {
		const normalizedPath = filePath.replace(/\\/g, "/");
		const content = fs.default.readFileSync(filePath, "utf8");
		const { data: frontmatter } = (0, import_gray_matter.default)(content);
		const { id, system } = deriveIdAndSystem(filePath, ENGINEERING_DIR);
		const doc = {
			id: frontmatter.id || id,
			title: frontmatter.title || "",
			type: frontmatter.type || "pattern",
			summary: frontmatter.summary || "",
			keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
			system,
			paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
			filePath: normalizedPath
		};
		if (args.type && doc.type !== args.type) continue;
		if (args.system && doc.system !== args.system) continue;
		docs.push(doc);
	}
	const result = {
		count: docs.length,
		docs
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion