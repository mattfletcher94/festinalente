#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/check-product.ts
const PRODUCT_DIR = ".kanban/product";
function main() {
	const ids = process.argv.slice(2);
	if (ids.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: check-product.cjs id1 id2 ... (e.g., auth/login auth/mfa)"
		}));
		process.exit(1);
	}
	const results = [];
	const existing = [];
	const missing = [];
	for (const id of ids) {
		const docPath = path.default.join(PRODUCT_DIR, `${id}.md`).replace(/\\/g, "/");
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