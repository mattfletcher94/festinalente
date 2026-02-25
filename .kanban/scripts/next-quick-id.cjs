#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const fs = require_chunk.__toESM(require("fs"));

//#region src/scripts/next-quick-id.ts
const QUICK_DIR = ".kanban/quick";
/**

* Get the next available quick task ID.

*/
function main() {
	const padding = 3;
	if (!fs.default.existsSync(QUICK_DIR)) {
		const result$1 = {
			nextId: "0".padStart(padding, "0"),
			currentHighest: null,
			padding
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	const folders = fs.default.readdirSync(QUICK_DIR, { withFileTypes: true }).filter((f) => f.isDirectory()).map((f) => f.name);
	if (folders.length === 0) {
		const result$1 = {
			nextId: "0".padStart(padding, "0"),
			currentHighest: null,
			padding
		};
		console.log(JSON.stringify(result$1, null, 2));
		return;
	}
	let highest = -1;
	for (const folderName of folders) {
		const id = parseInt(folderName, 10);
		if (!isNaN(id) && id > highest) highest = id;
	}
	const nextId = (highest + 1).toString().padStart(padding, "0");
	const currentHighest = highest >= 0 ? highest.toString().padStart(padding, "0") : null;
	const result = {
		nextId,
		currentHighest,
		padding
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion