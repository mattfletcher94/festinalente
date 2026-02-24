#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_js_yaml = require('./js-yaml-B0muWMf8.cjs');
const fs = require_chunk.__toESM(require("fs"));

//#region src/scripts/get-hook-config.ts
const CONFIG_FILE = ".kanban/config.yaml";
const DIRECTIVES_DIR = ".kanban/directives";
const PRODUCT_DIR = ".kanban/product";
const ENGINEERING_DIR = ".kanban/engineering";
function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: get-hook-config.cjs <hook> (e.g., kanban-check)"
		}));
		process.exit(1);
	}
	const hookName = args[0];
	if (!fs.default.existsSync(CONFIG_FILE)) {
		console.log(JSON.stringify({
			error: true,
			message: `${CONFIG_FILE} not found. Run npx claude-kanban first.`
		}));
		process.exit(1);
	}
	let config;
	try {
		const content = fs.default.readFileSync(CONFIG_FILE, "utf8");
		config = require_js_yaml.jsYaml.load(content);
	} catch (err) {
		console.log(JSON.stringify({
			error: true,
			message: `Failed to parse ${CONFIG_FILE}: ${err instanceof Error ? err.message : String(err)}`
		}));
		process.exit(1);
	}
	const hooks = config.hooks;
	if (!hooks) {
		console.log(JSON.stringify({
			hook: hookName,
			tier: "standard",
			directives: [],
			product: [],
			engineering: []
		}));
		return;
	}
	const hookConfig = hooks[hookName];
	if (!hookConfig) {
		console.log(JSON.stringify({
			hook: hookName,
			tier: "standard",
			directives: [],
			product: [],
			engineering: []
		}));
		return;
	}
	const tier = hookConfig.tier || "standard";
	const directives = (hookConfig.directives || []).map((name) => {
		const path = `${DIRECTIVES_DIR}/${name}/DIRECTIVE.md`.replace(/\\/g, "/");
		return {
			name,
			path,
			exists: fs.default.existsSync(path)
		};
	});
	const product = (hookConfig.product || []).map((id) => {
		const path = `${PRODUCT_DIR}/${id}.md`.replace(/\\/g, "/");
		return {
			id,
			path,
			exists: fs.default.existsSync(path)
		};
	});
	const engineering = (hookConfig.engineering || []).map((id) => {
		const path = `${ENGINEERING_DIR}/${id}.md`.replace(/\\/g, "/");
		return {
			id,
			path,
			exists: fs.default.existsSync(path)
		};
	});
	const result = {
		hook: hookName,
		tier,
		directives,
		product,
		engineering
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion