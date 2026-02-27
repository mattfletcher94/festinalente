#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const require_fuse = require('./fuse-Qm11Ho2o.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/search-product.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const PRODUCT_DIR = ".festinalente/product";
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
function deriveIdAndDomain(filePath, productDir) {
	const relativePath = path.default.relative(productDir, filePath).replace(/\\/g, "/");
	const withoutExt = relativePath.replace(/\.md$/, "");
	const parts = withoutExt.split("/");
	if (parts.length === 1) return {
		id: parts[0],
		domain: null
	};
	else return {
		id: withoutExt,
		domain: parts[0]
	};
}
function loadDocs() {
	const files = scanRecursive(PRODUCT_DIR);
	const docs = [];
	for (const filePath of files) {
		const normalizedPath = filePath.replace(/\\/g, "/");
		const content = fs.default.readFileSync(filePath, "utf8");
		const { data: frontmatter, content: body } = (0, import_gray_matter.default)(content);
		const { id, domain } = deriveIdAndDomain(filePath, PRODUCT_DIR);
		docs.push({
			id: frontmatter.id || id,
			title: frontmatter.title || "",
			type: frontmatter.type || "feature",
			tldr: frontmatter.tldr || "",
			summary: frontmatter.summary || "",
			keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
			aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
			boundary: frontmatter.boundary || "",
			domain,
			body: body.slice(0, 1e3),
			path: normalizedPath
		});
	}
	return docs;
}
function checkBoundaryMatch(boundary, searchTerms) {
	if (!boundary) return false;
	const boundaryLower = boundary.toLowerCase();
	for (const term of searchTerms) if (boundaryLower.includes(term.toLowerCase())) return true;
	return false;
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const searchTerms = args._;
	const minScore = args["min-score"] ? parseFloat(args["min-score"]) : .3;
	if (searchTerms.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: search-product.cjs keyword1 keyword2 ... [--min-score=0.3]"
		}));
		process.exit(1);
	}
	if (!fs.default.existsSync(PRODUCT_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${PRODUCT_DIR}/ directory not found. Run npx claude-kanban first.`
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
				weight: .35
			},
			{
				name: "aliases",
				weight: .35
			},
			{
				name: "title",
				weight: .25
			},
			{
				name: "tldr",
				weight: .25
			},
			{
				name: "id",
				weight: .2
			},
			{
				name: "summary",
				weight: .15
			},
			{
				name: "domain",
				weight: .1
			},
			{
				name: "body",
				weight: .05
			}
		],
		threshold: .4,
		includeScore: true,
		ignoreLocation: true,
		findAllMatches: true
	});
	const docScores = new Map();
	for (const term of searchTerms) {
		const termResults = fuse.search(term);
		for (const result of termResults) {
			const docId = result.item.id;
			const score = 1 - (result.score || 0);
			if (!docScores.has(docId)) docScores.set(docId, {
				doc: result.item,
				scores: [],
				bestScore: 0
			});
			const entry = docScores.get(docId);
			entry.scores.push(score);
			entry.bestScore = Math.max(entry.bestScore, score);
		}
	}
	const fuseResults = Array.from(docScores.values()).map((entry) => {
		const avgScore = entry.scores.reduce((a, b) => a + b, 0) / searchTerms.length;
		const matchBonus = 1 + .1 * entry.scores.length;
		const combinedScore = Math.min(1, avgScore * matchBonus);
		return {
			item: entry.doc,
			score: 1 - combinedScore
		};
	});
	const results = fuseResults.map((result) => {
		const baseScore = 1 - (result.score || 0);
		const hasBoundaryMatch = checkBoundaryMatch(result.item.boundary, searchTerms);
		const adjustedScore = hasBoundaryMatch ? Math.max(0, baseScore - .15) : baseScore;
		return {
			id: result.item.id,
			title: result.item.title,
			score: Math.round(adjustedScore * 100) / 100,
			summary: result.item.summary,
			tldr: result.item.tldr,
			path: result.item.path,
			boundaryPenalty: hasBoundaryMatch
		};
	}).filter((result) => result.score >= minScore).sort((a, b) => b.score - a.score);
	const output = {
		query: searchTerms,
		count: results.length,
		docs: results
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion