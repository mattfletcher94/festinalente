#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C8mdMRV3.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-quick.ts
const QUICK_DIR = ".kanban/quick";
/**

* Find a quick task file by ID.

*

* @param id - The quick task ID to find.

* @returns The path to the quick.xml file, or null if not found.

*/
function findQuickFile(id) {
	const quickPath = path.default.join(QUICK_DIR, id, "quick.xml");
	if (fs.default.existsSync(quickPath)) return quickPath.replace(/\\/g, "/");
	return null;
}
/**

* Main entry point.

*/
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: find-quick.cjs <id>"
		}));
		process.exit(1);
	}
	const id = args[0];
	if (!fs.default.existsSync(QUICK_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${QUICK_DIR}/ directory not found. No quick tasks exist yet.`
		}));
		process.exit(1);
	}
	const quickPath = findQuickFile(id);
	if (!quickPath) {
		console.log(JSON.stringify({
			error: true,
			message: `Quick task ${id} not found in ${QUICK_DIR}/${id}/`
		}));
		process.exit(1);
	}
	const content = fs.default.readFileSync(quickPath, "utf8");
	const parsed = require_xml_parser.parseQuickXml(content);
	const result = {
		id,
		filename: "quick.xml",
		path: quickPath,
		title: parsed.title,
		created: parsed.created,
		updated: parsed.updated
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion