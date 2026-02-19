#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const require_fuse = require('./fuse-Qm11Ho2o.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/search-hybrid.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const PRODUCT_DIR = ".kanban/product";
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
function deriveId(filePath, baseDir) {
	const relativePath = path.default.relative(baseDir, filePath).replace(/\\/g, "/");
	const withoutExt = relativePath.replace(/\.md$/, "");
	const parts = withoutExt.split("/");
	if (parts[0] === "systems" && parts.length === 3 && parts[2] === "index") return `${parts[0]}/${parts[1]}`;
	return withoutExt;
}
function loadDocs(docType, dir) {
	const files = scanRecursive(dir);
	const docs = [];
	for (const filePath of files) {
		const normalizedPath = filePath.replace(/\\/g, "/");
		const content = fs.default.readFileSync(filePath, "utf8");
		const { data: frontmatter, content: body } = (0, import_gray_matter.default)(content);
		const id = deriveId(filePath, dir);
		docs.push({
			id: frontmatter.id || id,
			title: frontmatter.title || "",
			type: frontmatter.type || "feature",
			tldr: frontmatter.tldr || "",
			summary: frontmatter.summary || "",
			keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords.map((k) => k.toLowerCase()) : [],
			aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases.map((a) => a.toLowerCase()) : [],
			boundary: frontmatter.boundary || "",
			body: body.slice(0, 1e3),
			path: normalizedPath,
			docType
		});
	}
	return docs;
}
function checkExactMatch(terms, searchTerms) {
	const lowerSearchTerms = searchTerms.map((t) => t.toLowerCase());
	for (const term of terms) if (lowerSearchTerms.includes(term.toLowerCase())) return true;
	return false;
}
function checkBoundaryMatch(boundary, searchTerms) {
	if (!boundary) return 0;
	const boundaryLower = boundary.toLowerCase();
	for (const term of searchTerms) if (boundaryLower.includes(term.toLowerCase())) return .15;
	return 0;
}
function runFuzzySearch(docs, searchTerms) {
	const results = new Map();
	for (const doc of docs) results.set(doc.id, {
		title: 0,
		tldr: 0,
		body: 0
	});
	const query = searchTerms.join(" ");
	const fuseTitleConfig = {
		keys: ["title"],
		threshold: .4,
		includeScore: true,
		ignoreLocation: true
	};
	const fuseTitle = new require_fuse.Fuse(docs, fuseTitleConfig);
	for (const result of fuseTitle.search(query)) {
		const current = results.get(result.item.id);
		current.title = 1 - (result.score || 0);
	}
	const fuseTldrConfig = {
		keys: ["tldr"],
		threshold: .4,
		includeScore: true,
		ignoreLocation: true
	};
	const fuseTldr = new require_fuse.Fuse(docs, fuseTldrConfig);
	for (const result of fuseTldr.search(query)) {
		const current = results.get(result.item.id);
		current.tldr = 1 - (result.score || 0);
	}
	const fuseBodyConfig = {
		keys: ["body"],
		threshold: .5,
		includeScore: true,
		ignoreLocation: true
	};
	const fuseBody = new require_fuse.Fuse(docs, fuseBodyConfig);
	for (const result of fuseBody.search(query)) {
		const current = results.get(result.item.id);
		current.body = 1 - (result.score || 0);
	}
	return results;
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const searchTerms = args._;
	const minScore = args["min-score"] ? parseFloat(args["min-score"]) : .3;
	const docTypeFilter = args.type;
	if (searchTerms.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: search-hybrid.cjs keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]"
		}));
		process.exit(1);
	}
	let docs = [];
	if (!docTypeFilter || docTypeFilter === "product") {
		if (fs.default.existsSync(PRODUCT_DIR)) docs = docs.concat(loadDocs("product", PRODUCT_DIR));
	}
	if (!docTypeFilter || docTypeFilter === "engineering") {
		if (fs.default.existsSync(ENGINEERING_DIR)) docs = docs.concat(loadDocs("engineering", ENGINEERING_DIR));
	}
	if (docs.length === 0) {
		const output$1 = {
			query: searchTerms,
			results: []
		};
		console.log(JSON.stringify(output$1, null, 2));
		return;
	}
	const fuzzyScores = runFuzzySearch(docs, searchTerms);
	const results = [];
	for (const doc of docs) {
		const exactKeyword = checkExactMatch(doc.keywords, searchTerms);
		const exactAlias = checkExactMatch(doc.aliases, searchTerms);
		const fuzzy = fuzzyScores.get(doc.id);
		const boundaryPenalty = checkBoundaryMatch(doc.boundary, searchTerms);
		let score = 0;
		if (exactKeyword) score += .3;
		if (exactAlias) score += .25;
		score += fuzzy.title * .2;
		score += fuzzy.tldr * .15;
		score += fuzzy.body * .1;
		score = Math.max(0, score - boundaryPenalty);
		if (score >= minScore || exactKeyword || exactAlias) results.push({
			id: doc.id,
			title: doc.title,
			score: Math.round(score * 100) / 100,
			matchSources: {
				exactKeyword,
				exactAlias,
				fuzzyTitle: Math.round(fuzzy.title * 100) / 100,
				fuzzyTldr: Math.round(fuzzy.tldr * 100) / 100,
				fuzzyBody: Math.round(fuzzy.body * 100) / 100
			},
			boundaryPenalty: Math.round(boundaryPenalty * 100) / 100,
			path: doc.path,
			docType: doc.docType,
			tldr: doc.tldr,
			summary: doc.summary
		});
	}
	results.sort((a, b) => b.score - a.score);
	const output = {
		query: searchTerms,
		results
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion