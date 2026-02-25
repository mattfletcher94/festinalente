const require_chunk = require('./chunk-DWy1uDak.cjs');
const fast_xml_parser = require_chunk.__toESM(require("fast-xml-parser"));

//#region src/scripts/lib/xml-parser.ts
const parser = new fast_xml_parser.XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
	textNodeName: "_text"
});
function parseTaskXml(content) {
	const result = parser.parse(content);
	const task = result.task;
	return {
		id: task.id || "",
		status: task.status || "",
		priority: task.priority || "",
		title: task.title || "",
		labels: Array.isArray(task.labels?.label) ? task.labels.label : task.labels?.label ? [task.labels.label] : [],
		created: task.created || "",
		updated: task.updated || ""
	};
}
function parseSpecXml(content) {
	const result = parser.parse(content);
	const spec = result.spec;
	return {
		task: spec.task || "",
		title: spec.title || "",
		created: spec.created || "",
		updated: spec.updated || ""
	};
}
function parsePlanXml(content) {
	const result = parser.parse(content);
	const plan = result.plan;
	return {
		task: plan.task || "",
		spec: plan.spec || "",
		status: plan.status || "",
		iteration: parseInt(plan.iteration || "1", 10),
		title: plan.title || ""
	};
}
/**
* Parse a quick.xml file.
*
* @param content - The XML content to parse.
* @returns Parsed quick task metadata.
*/
function parseQuickXml(content) {
	const result = parser.parse(content);
	const quick = result.quick;
	return {
		id: quick.id || "",
		title: quick.title || "",
		created: quick.created || "",
		updated: quick.updated || ""
	};
}

//#endregion
Object.defineProperty(exports, 'parsePlanXml', {
  enumerable: true,
  get: function () {
    return parsePlanXml;
  }
});
Object.defineProperty(exports, 'parseQuickXml', {
  enumerable: true,
  get: function () {
    return parseQuickXml;
  }
});
Object.defineProperty(exports, 'parseSpecXml', {
  enumerable: true,
  get: function () {
    return parseSpecXml;
  }
});
Object.defineProperty(exports, 'parseTaskXml', {
  enumerable: true,
  get: function () {
    return parseTaskXml;
  }
});