#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-eGHh6fA9.cjs');
const require_fuse = require('./fuse-BxOLNH3G.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/search-engineering.ts
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
function loadDocs() {
	const files = scanRecursive(ENGINEERING_DIR);
	const docs = [];
	for (const filePath of files) {
		const normalizedPath = filePath.replace(/\\/g, "/");
		const content = fs.default.readFileSync(filePath, "utf8");
		const { data: frontmatter, content: body } = (0, import_gray_matter.default)(content);
		const { id, system } = deriveIdAndSystem(filePath, ENGINEERING_DIR);
		docs.push({
			id: frontmatter.id || id,
			title: frontmatter.title || "",
			type: frontmatter.type || "pattern",
			summary: frontmatter.summary || "",
			keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
			system,
			paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
			body: body.slice(0, 1e3),
			filePath: normalizedPath
		});
	}
	return docs;
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const searchTerms = args._;
	const minScore = args["min-score"] ? parseFloat(args["min-score"]) : .3;
	if (searchTerms.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: search-engineering.cjs keyword1 keyword2 ... [--min-score=0.3]"
		}));
		process.exit(1);
	}
	if (!fs.default.existsSync(ENGINEERING_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${ENGINEERING_DIR}/ directory not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	const docs = loadDocs();
	if (docs.length === 0) {
		console.log(JSON.stringify({
			query: searchTerms,
			count: 0,
			docs: []
		}));
		return;
	}
	const fuse = new require_fuse.Fuse(docs, {
		keys: [
			{
				name: "keywords",
				weight: .4
			},
			{
				name: "title",
				weight: .3
			},
			{
				name: "id",
				weight: .25
			},
			{
				name: "summary",
				weight: .2
			},
			{
				name: "system",
				weight: .15
			},
			{
				name: "paths",
				weight: .15
			},
			{
				name: "body",
				weight: .1
			}
		],
		threshold: .4,
		includeScore: true,
		ignoreLocation: true,
		useExtendedSearch: true,
		findAllMatches: true
	});
	const query = searchTerms.join(" ");
	const fuseResults = fuse.search(query);
	const results = fuseResults.map((result) => ({
		id: result.item.id,
		title: result.item.title,
		score: Math.round((1 - (result.score || 0)) * 100) / 100,
		summary: result.item.summary,
		path: result.item.filePath
	})).filter((result) => result.score >= minScore);
	const output = {
		query: searchTerms,
		count: results.length,
		docs: results
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion