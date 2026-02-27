#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/select-context.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const TASKS_DIR = ".festinalente/tasks";
const PRODUCT_DIR = ".festinalente/product";
const ENGINEERING_DIR = ".festinalente/engineering";
function parseArgs(args) {
	const result = { _: [] };
	for (const arg of args) if (arg.startsWith("--")) {
		const [key, value] = arg.slice(2).split("=");
		result[key] = value || true;
	} else result._.push(arg);
	return result;
}
function findTaskFile(taskId) {
	const taskDir = path.default.join(TASKS_DIR, taskId);
	const taskFile = path.default.join(taskDir, "task.xml");
	if (fs.default.existsSync(taskFile)) return taskFile;
	if (fs.default.existsSync(TASKS_DIR)) {
		const entries = fs.default.readdirSync(TASKS_DIR);
		for (const entry of entries) if (entry.endsWith(taskId) || entry === taskId) {
			const possibleFile = path.default.join(TASKS_DIR, entry, "task.xml");
			if (fs.default.existsSync(possibleFile)) return possibleFile;
		}
	}
	return null;
}
function parseTaskXml(content) {
	const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
	const descMatch = content.match(/<description>([\s\S]*?)<\/description>/);
	const affectsMatch = content.match(/<affects>([\s\S]*?)<\/affects>/);
	const engineeringMatch = content.match(/<engineering>([\s\S]*?)<\/engineering>/);
	const parseIds = (text) => {
		if (!text) return [];
		const refMatches = text.match(/<ref[^>]*>([^<]*)<\/ref>/g) || [];
		const ids = refMatches.map((r) => {
			const idMatch = r.match(/>([^<]*)</);
			return idMatch ? idMatch[1].trim() : "";
		}).filter(Boolean);
		if (ids.length === 0) return text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
		return ids;
	};
	return {
		title: titleMatch ? titleMatch[1].trim() : "",
		description: descMatch ? descMatch[1].trim() : "",
		affects: parseIds(affectsMatch?.[1]),
		engineering: parseIds(engineeringMatch?.[1])
	};
}
function readDoc(docPath, docType) {
	if (!fs.default.existsSync(docPath)) return null;
	try {
		const content = fs.default.readFileSync(docPath, "utf8");
		const { data: frontmatter, content: body } = (0, import_gray_matter.default)(content);
		return {
			id: frontmatter.id || path.default.basename(docPath, ".md"),
			type: docType,
			relevanceScore: 1,
			content: body,
			tldr: frontmatter.tldr || "",
			summary: frontmatter.summary || "",
			boundary: frontmatter.boundary || ""
		};
	} catch {
		return null;
	}
}
function resolveDocPath(id, baseDir) {
	let docPath = path.default.join(baseDir, `${id}.md`);
	if (fs.default.existsSync(docPath)) return docPath;
	if (baseDir === ENGINEERING_DIR && id.startsWith("systems/")) {
		docPath = path.default.join(baseDir, id, "_index.md");
		if (fs.default.existsSync(docPath)) return docPath;
	}
	docPath = path.default.join(baseDir, id);
	if (!docPath.endsWith(".md")) docPath += ".md";
	return docPath;
}
function getTieredContent(doc, tier) {
	switch (tier) {
		case "minimal": return doc.tldr || doc.summary?.split(".")[0] || "";
		case "standard":
			const parts = [];
			if (doc.tldr) parts.push(`**TL;DR:** ${doc.tldr}`);
			if (doc.summary) parts.push(`**Summary:** ${doc.summary}`);
			if (doc.boundary) parts.push(`**Boundaries:** ${doc.boundary}`);
			return parts.join("\n\n");
		case "full":
		default: return doc.content;
	}
}
function estimateTokens(text) {
	return Math.ceil(text.length / 4);
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const taskId = args._[0];
	const tier = args.tier || "standard";
	const maxDocs = args.max ? parseInt(args.max, 10) : 5;
	if (!taskId) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: select-context.cjs <task-id> [--tier=minimal|standard|full] [--max=5]"
		}));
		process.exit(1);
	}
	const taskFile = findTaskFile(taskId);
	if (!taskFile) {
		console.log(JSON.stringify({
			error: true,
			message: `Task ${taskId} not found`
		}));
		process.exit(1);
	}
	const taskContent = fs.default.readFileSync(taskFile, "utf8");
	const task = parseTaskXml(taskContent);
	const docs = [];
	const seenIds = new Set();
	for (const id of task.affects) {
		if (seenIds.has(id)) continue;
		seenIds.add(id);
		const docPath = resolveDocPath(id, PRODUCT_DIR);
		const doc = readDoc(docPath, "product");
		if (doc) {
			doc.relevanceScore = 1;
			docs.push(doc);
		}
	}
	for (const id of task.engineering) {
		if (seenIds.has(id)) continue;
		seenIds.add(id);
		const docPath = resolveDocPath(id, ENGINEERING_DIR);
		const doc = readDoc(docPath, "engineering");
		if (doc) {
			doc.relevanceScore = 1;
			docs.push(doc);
		}
	}
	docs.sort((a, b) => b.relevanceScore - a.relevanceScore);
	const selectedDocs = docs.slice(0, maxDocs);
	const tieredDocs = selectedDocs.map((doc) => ({
		...doc,
		content: getTieredContent(doc, tier)
	}));
	const totalTokens = tieredDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0);
	const output = {
		taskId,
		tier,
		docs: tieredDocs,
		totalTokensEstimate: totalTokens
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion