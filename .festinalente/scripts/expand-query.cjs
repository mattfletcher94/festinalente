#!/usr/bin/env node
const require_chunk = require('./chunk-DWy1uDak.cjs');
const require_js_yaml = require('./js-yaml-B0muWMf8.cjs');
const fs = require_chunk.__toESM(require("fs"));

//#region src/scripts/expand-query.ts
const GLOSSARY_FILE = ".festinalente/glossary.yaml";
function loadGlossary() {
	if (!fs.default.existsSync(GLOSSARY_FILE)) return null;
	try {
		const content = fs.default.readFileSync(GLOSSARY_FILE, "utf8");
		return require_js_yaml.jsYaml.load(content);
	} catch {
		return null;
	}
}
function expandQuery(terms, glossary) {
	const expanded = new Set();
	const matches = [];
	for (const term of terms) expanded.add(term.toLowerCase());
	for (const term of terms) {
		const termLower = term.toLowerCase();
		for (const entry of glossary.terms) {
			const entryTermLower = entry.term.toLowerCase();
			const aliasesLower = entry.aliases.map((a) => a.toLowerCase());
			if (termLower === entryTermLower || aliasesLower.includes(termLower)) {
				expanded.add(entryTermLower);
				for (const alias of entry.aliases) expanded.add(alias.toLowerCase());
				matches.push({
					term: entry.term,
					matchedOn: term,
					aliases: entry.aliases
				});
			}
		}
	}
	return {
		original: terms,
		expanded: Array.from(expanded),
		glossaryMatches: matches
	};
}
function main() {
	const terms = process.argv.slice(2);
	if (terms.length === 0) {
		console.log(JSON.stringify({
			error: true,
			message: "Usage: expand-query.cjs keyword1 keyword2 ..."
		}));
		process.exit(1);
	}
	const glossary = loadGlossary();
	if (!glossary || !glossary.terms || glossary.terms.length === 0) {
		const output$1 = {
			original: terms,
			expanded: terms,
			glossaryMatches: []
		};
		console.log(JSON.stringify(output$1, null, 2));
		return;
	}
	const output = expandQuery(terms, glossary);
	console.log(JSON.stringify(output, null, 2));
}
main();

//#endregion