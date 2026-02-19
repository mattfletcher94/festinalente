#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/check-engineering.ts
const ENGINEERING_DIR = ".kanban/engineering";
/**
* Convert engineering doc ID to file path
*
* ID → Path mapping rules:
* - `overview` → `.kanban/engineering/overview.md`
* - `systems/auth` → `.kanban/engineering/systems/auth/_index.md`
* - `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
* - `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
* - `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
*/
function idToPath(id) {
	if (id === "overview") return path.default.join(ENGINEERING_DIR, "overview.md");
	const parts = id.split("/");
	if (parts[0] === "systems" && parts.length === 2) return path.default.join(ENGINEERING_DIR, parts[0], parts[1], "_index.md");
	return path.default.join(ENGINEERING_DIR, `${id}.md`);
}
function main() {
	const ids = process.argv.slice(2);
	if (ids.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: check-engineering.cjs id1 id2 ... (e.g., systems/auth patterns/middleware)"
		}));
		process.exit(1);
	}
	const results = [];
	const existing = [];
	const missing = [];
	for (const id of ids) {
		const docPath = idToPath(id).replace(/\\/g, "/");
		const exists = fs.default.existsSync(docPath);
		results.push({
			id,
			exists,
			path: docPath
		});
		if (exists) existing.push(id);
		else missing.push(id);
	}
	const output = {
		results,
		summary: {
			existing,
			missing
		}
	};
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion