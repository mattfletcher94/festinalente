#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_gray_matter$1 = require('./gray-matter-Cxe2PDJm.cjs');
const fs = require_chunk.__toESM(require("fs"));
const path = require_chunk.__toESM(require("path"));

//#region src/scripts/find-plan.ts
var import_gray_matter = require_chunk.__toESM(require_gray_matter$1.require_gray_matter(), 1);
const TASKS_DIR = ".kanban/tasks";
function findPlanFile(id) {
	const planPath = path.default.join(TASKS_DIR, id, "plan.md");
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
			message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
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
	const { data: frontmatter } = (0, import_gray_matter.default)(content);
	const result = {
		id,
		filename: "plan.md",
		path: planPath,
		task: frontmatter.task || id,
		spec: frontmatter.spec || "",
		status: frontmatter.status || "",
		iteration: parseInt(frontmatter.iteration || "1", 10) || 1
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion