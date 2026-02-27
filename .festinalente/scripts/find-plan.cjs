#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_xml_parser = require('./xml-parser-C8mdMRV3.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-plan.ts
const TASKS_DIR = ".festinalente/tasks";
function findPlanFile(id) {
	const planPath = path.default.join(TASKS_DIR, id, "plan.xml");
	if (fs.default.existsSync(planPath)) return planPath.replace(/\\/g, "/");
	return null;
}
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: find-plan.cjs <id>"
		}));
		process.exit(1);
	}
	const id = args[0];
	if (!fs.default.existsSync(TASKS_DIR)) {
		console.log(JSON.stringify({
			error: true,
			message: `${TASKS_DIR}/ directory not found. Run npx festinalente first.`
		}));
		process.exit(1);
	}
	const planPath = findPlanFile(id);
	if (!planPath) {
		console.log(JSON.stringify({
			error: true,
			message: `Plan for task ${id} not found in ${TASKS_DIR}/${id}/`
		}));
		process.exit(1);
	}
	const content = fs.default.readFileSync(planPath, "utf8");
	const parsed = require_xml_parser.parsePlanXml(content);
	const result = {
		id,
		filename: "plan.xml",
		path: planPath,
		task: parsed.task || id,
		spec: parsed.spec,
		status: parsed.status,
		iteration: parsed.iteration
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion