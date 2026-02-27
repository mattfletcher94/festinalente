#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));
const child_process = require_chunk.__toESM(require("child_process"));

//#region src/scripts/check-freshness.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
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
function getGitLastModified(filePath) {
	try {
		const result = (0, child_process.execSync)(`git log -1 --format=%cI -- "${filePath}"`, {
			encoding: "utf8",
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		}).trim();
		if (result) return new Date(result);
	} catch {}
	try {
		const stats = fs.default.statSync(filePath);
		return stats.mtime;
	} catch {
		return null;
	}
}
function daysBetween(date1, date2) {
	const msPerDay = 24 * 60 * 60 * 1e3;
	return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}
function checkDocFreshness(docPath, staleDays) {
	const content = fs.default.readFileSync(docPath, "utf8");
	const { data: frontmatter } = (0, import_gray_matter.default)(content);
	const verified = frontmatter.verified;
	const codeRefs = frontmatter.code_refs || [];
	if (!verified) return {
		isStale: false,
		verifiedDate: null,
		codeRefs,
		modifiedCodeRefs: [],
		daysSinceVerified: -1
	};
	const verifiedDate = new Date(verified);
	const now = new Date();
	const daysSince = daysBetween(verifiedDate, now);
	if (daysSince < staleDays) return {
		isStale: false,
		verifiedDate: verified,
		codeRefs,
		modifiedCodeRefs: [],
		daysSinceVerified: daysSince
	};
	const modifiedRefs = [];
	for (const ref of codeRefs) if (fs.default.existsSync(ref)) {
		const lastModified = getGitLastModified(ref);
		if (lastModified && lastModified > verifiedDate) modifiedRefs.push(ref);
	}
	return {
		isStale: modifiedRefs.length > 0,
		verifiedDate: verified,
		codeRefs,
		modifiedCodeRefs: modifiedRefs,
		daysSinceVerified: daysSince
	};
}
function main() {
	const args = parseArgs(process.argv.slice(2));
	const staleDays = args["stale-days"] ? parseInt(args["stale-days"], 10) : 30;
	const typeFilter = args.type;
	const docsToCheck = [];
	if (!typeFilter || typeFilter === "product") for (const docPath of scanRecursive(PRODUCT_DIR)) {
		const relativePath = path.default.relative(PRODUCT_DIR, docPath).replace(/\\/g, "/");
		const id = relativePath.replace(/\.md$/, "");
		docsToCheck.push({
			path: docPath,
			id
		});
	}
	if (!typeFilter || typeFilter === "engineering") for (const docPath of scanRecursive(ENGINEERING_DIR)) {
		const relativePath = path.default.relative(ENGINEERING_DIR, docPath).replace(/\\/g, "/");
		let id = relativePath.replace(/\.md$/, "");
		if (id.endsWith("/_index")) id = id.replace(/\/_index$/, "");
		docsToCheck.push({
			path: docPath,
			id
		});
	}
	const staleDocs = [];
	let freshCount = 0;
	let noVerificationCount = 0;
	for (const { path: docPath, id } of docsToCheck) {
		const result = checkDocFreshness(docPath, staleDays);
		if (result.verifiedDate === null) noVerificationCount++;
		else if (result.isStale) staleDocs.push({
			id,
			path: docPath.replace(/\\/g, "/"),
			verifiedDate: result.verifiedDate,
			codeRefs: result.codeRefs,
			modifiedCodeRefs: result.modifiedCodeRefs,
			daysSinceVerified: result.daysSinceVerified
		});
		else freshCount++;
	}
	const output = {
		totalDocs: docsToCheck.length,
		fresh: freshCount,
		stale: staleDocs.length,
		noVerification: noVerificationCount,
		staleDocs
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion