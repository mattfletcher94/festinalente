#!/usr/bin/env node
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i$2 = 0, n = keys.length, key; i$2 < n; i$2++) {
		key = keys[i$2];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
const fs = __toESM(require("fs"));
const path = __toESM(require("path"));

//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util$1) {
	util$1.assertEqual = (_) => {};
	function assertIs(_arg) {}
	util$1.assertIs = assertIs;
	function assertNever(_x) {
		throw new Error();
	}
	util$1.assertNever = assertNever;
	util$1.arrayToEnum = (items) => {
		const obj = {};
		for (const item of items) obj[item] = item;
		return obj;
	};
	util$1.getValidEnumValues = (obj) => {
		const validKeys = util$1.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
		const filtered = {};
		for (const k of validKeys) filtered[k] = obj[k];
		return util$1.objectValues(filtered);
	};
	util$1.objectValues = (obj) => {
		return util$1.objectKeys(obj).map(function(e) {
			return obj[e];
		});
	};
	util$1.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
		const keys = [];
		for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
		return keys;
	};
	util$1.find = (arr, checker) => {
		for (const item of arr) if (checker(item)) return item;
		return void 0;
	};
	util$1.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
	function joinValues(array, separator = " | ") {
		return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
	}
	util$1.joinValues = joinValues;
	util$1.jsonStringifyReplacer = (_, value) => {
		if (typeof value === "bigint") return value.toString();
		return value;
	};
})(util || (util = {}));
var objectUtil;
(function(objectUtil$1) {
	objectUtil$1.mergeShapes = (first, second) => {
		return {
			...first,
			...second
		};
	};
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
	"string",
	"nan",
	"number",
	"integer",
	"float",
	"boolean",
	"date",
	"bigint",
	"symbol",
	"function",
	"undefined",
	"null",
	"array",
	"object",
	"unknown",
	"promise",
	"void",
	"never",
	"map",
	"set"
]);
const getParsedType = (data) => {
	const t = typeof data;
	switch (t) {
		case "undefined": return ZodParsedType.undefined;
		case "string": return ZodParsedType.string;
		case "number": return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
		case "boolean": return ZodParsedType.boolean;
		case "function": return ZodParsedType.function;
		case "bigint": return ZodParsedType.bigint;
		case "symbol": return ZodParsedType.symbol;
		case "object":
			if (Array.isArray(data)) return ZodParsedType.array;
			if (data === null) return ZodParsedType.null;
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return ZodParsedType.promise;
			if (typeof Map !== "undefined" && data instanceof Map) return ZodParsedType.map;
			if (typeof Set !== "undefined" && data instanceof Set) return ZodParsedType.set;
			if (typeof Date !== "undefined" && data instanceof Date) return ZodParsedType.date;
			return ZodParsedType.object;
		default: return ZodParsedType.unknown;
	}
};

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
const ZodIssueCode = util.arrayToEnum([
	"invalid_type",
	"invalid_literal",
	"custom",
	"invalid_union",
	"invalid_union_discriminator",
	"invalid_enum_value",
	"unrecognized_keys",
	"invalid_arguments",
	"invalid_return_type",
	"invalid_date",
	"invalid_string",
	"too_small",
	"too_big",
	"invalid_intersection_types",
	"not_multiple_of",
	"not_finite"
]);
var ZodError = class ZodError extends Error {
	get errors() {
		return this.issues;
	}
	constructor(issues) {
		super();
		this.issues = [];
		this.addIssue = (sub) => {
			this.issues = [...this.issues, sub];
		};
		this.addIssues = (subs = []) => {
			this.issues = [...this.issues, ...subs];
		};
		const actualProto = new.target.prototype;
		if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
		else this.__proto__ = actualProto;
		this.name = "ZodError";
		this.issues = issues;
	}
	format(_mapper) {
		const mapper = _mapper || function(issue) {
			return issue.message;
		};
		const fieldErrors = { _errors: [] };
		const processError = (error$1) => {
			for (const issue of error$1.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
			else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
			else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
			else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i$2 = 0;
				while (i$2 < issue.path.length) {
					const el = issue.path[i$2];
					const terminal = i$2 === issue.path.length - 1;
					if (!terminal) curr[el] = curr[el] || { _errors: [] };
					else {
						curr[el] = curr[el] || { _errors: [] };
						curr[el]._errors.push(mapper(issue));
					}
					curr = curr[el];
					i$2++;
				}
			}
		};
		processError(this);
		return fieldErrors;
	}
	static assert(value) {
		if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
	}
	toString() {
		return this.message;
	}
	get message() {
		return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
	}
	get isEmpty() {
		return this.issues.length === 0;
	}
	flatten(mapper = (issue) => issue.message) {
		const fieldErrors = {};
		const formErrors = [];
		for (const sub of this.issues) if (sub.path.length > 0) {
			const firstEl = sub.path[0];
			fieldErrors[firstEl] = fieldErrors[firstEl] || [];
			fieldErrors[firstEl].push(mapper(sub));
		} else formErrors.push(mapper(sub));
		return {
			formErrors,
			fieldErrors
		};
	}
	get formErrors() {
		return this.flatten();
	}
};
ZodError.create = (issues) => {
	const error$1 = new ZodError(issues);
	return error$1;
};

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
const errorMap = (issue, _ctx) => {
	let message;
	switch (issue.code) {
		case ZodIssueCode.invalid_type:
			if (issue.received === ZodParsedType.undefined) message = "Required";
			else message = `Expected ${issue.expected}, received ${issue.received}`;
			break;
		case ZodIssueCode.invalid_literal:
			message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
			break;
		case ZodIssueCode.unrecognized_keys:
			message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
			break;
		case ZodIssueCode.invalid_union:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_union_discriminator:
			message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
			break;
		case ZodIssueCode.invalid_enum_value:
			message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
			break;
		case ZodIssueCode.invalid_arguments:
			message = `Invalid function arguments`;
			break;
		case ZodIssueCode.invalid_return_type:
			message = `Invalid function return type`;
			break;
		case ZodIssueCode.invalid_date:
			message = `Invalid date`;
			break;
		case ZodIssueCode.invalid_string:
			if (typeof issue.validation === "object") if ("includes" in issue.validation) {
				message = `Invalid input: must include "${issue.validation.includes}"`;
				if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
			} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
			else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
			else util.assertNever(issue.validation);
			else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
			else message = "Invalid";
			break;
		case ZodIssueCode.too_small:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.too_big:
			if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
			else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
			else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
			else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
			else message = "Invalid input";
			break;
		case ZodIssueCode.custom:
			message = `Invalid input`;
			break;
		case ZodIssueCode.invalid_intersection_types:
			message = `Intersection results could not be merged`;
			break;
		case ZodIssueCode.not_multiple_of:
			message = `Number must be a multiple of ${issue.multipleOf}`;
			break;
		case ZodIssueCode.not_finite:
			message = "Number must be finite";
			break;
		default:
			message = _ctx.defaultError;
			util.assertNever(issue);
	}
	return { message };
};
var en_default = errorMap;

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
let overrideErrorMap = en_default;
function getErrorMap() {
	return overrideErrorMap;
}

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
const makeIssue = (params) => {
	const { data, path: path$2, errorMaps, issueData } = params;
	const fullPath = [...path$2, ...issueData.path || []];
	const fullIssue = {
		...issueData,
		path: fullPath
	};
	if (issueData.message !== void 0) return {
		...issueData,
		path: fullPath,
		message: issueData.message
	};
	let errorMessage = "";
	const maps = errorMaps.filter((m) => !!m).slice().reverse();
	for (const map$1 of maps) errorMessage = map$1(fullIssue, {
		data,
		defaultError: errorMessage
	}).message;
	return {
		...issueData,
		path: fullPath,
		message: errorMessage
	};
};
function addIssueToContext(ctx, issueData) {
	const overrideMap = getErrorMap();
	const issue = makeIssue({
		issueData,
		data: ctx.data,
		path: ctx.path,
		errorMaps: [
			ctx.common.contextualErrorMap,
			ctx.schemaErrorMap,
			overrideMap,
			overrideMap === en_default ? void 0 : en_default
		].filter((x) => !!x)
	});
	ctx.common.issues.push(issue);
}
var ParseStatus = class ParseStatus {
	constructor() {
		this.value = "valid";
	}
	dirty() {
		if (this.value === "valid") this.value = "dirty";
	}
	abort() {
		if (this.value !== "aborted") this.value = "aborted";
	}
	static mergeArray(status, results) {
		const arrayValue = [];
		for (const s of results) {
			if (s.status === "aborted") return INVALID;
			if (s.status === "dirty") status.dirty();
			arrayValue.push(s.value);
		}
		return {
			status: status.value,
			value: arrayValue
		};
	}
	static async mergeObjectAsync(status, pairs$1) {
		const syncPairs = [];
		for (const pair of pairs$1) {
			const key = await pair.key;
			const value = await pair.value;
			syncPairs.push({
				key,
				value
			});
		}
		return ParseStatus.mergeObjectSync(status, syncPairs);
	}
	static mergeObjectSync(status, pairs$1) {
		const finalObject = {};
		for (const pair of pairs$1) {
			const { key, value } = pair;
			if (key.status === "aborted") return INVALID;
			if (value.status === "aborted") return INVALID;
			if (key.status === "dirty") status.dirty();
			if (value.status === "dirty") status.dirty();
			if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
		}
		return {
			status: status.value,
			value: finalObject
		};
	}
};
const INVALID = Object.freeze({ status: "aborted" });
const DIRTY = (value) => ({
	status: "dirty",
	value
});
const OK = (value) => ({
	status: "valid",
	value
});
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil$1) {
	errorUtil$1.errToObj = (message) => typeof message === "string" ? { message } : message || {};
	errorUtil$1.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

//#endregion
//#region ../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
	constructor(parent, value, path$2, key) {
		this._cachedPath = [];
		this.parent = parent;
		this.data = value;
		this._path = path$2;
		this._key = key;
	}
	get path() {
		if (!this._cachedPath.length) if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
		else this._cachedPath.push(...this._path, this._key);
		return this._cachedPath;
	}
};
const handleResult = (ctx, result) => {
	if (isValid(result)) return {
		success: true,
		data: result.value
	};
	else {
		if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
		return {
			success: false,
			get error() {
				if (this._error) return this._error;
				const error$1 = new ZodError(ctx.common.issues);
				this._error = error$1;
				return this._error;
			}
		};
	}
};
function processCreateParams(params) {
	if (!params) return {};
	const { errorMap: errorMap$1, invalid_type_error, required_error, description } = params;
	if (errorMap$1 && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
	if (errorMap$1) return {
		errorMap: errorMap$1,
		description
	};
	const customMap = (iss, ctx) => {
		const { message } = params;
		if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
		if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
		if (iss.code !== "invalid_type") return { message: ctx.defaultError };
		return { message: message ?? invalid_type_error ?? ctx.defaultError };
	};
	return {
		errorMap: customMap,
		description
	};
}
var ZodType = class {
	get description() {
		return this._def.description;
	}
	_getType(input) {
		return getParsedType(input.data);
	}
	_getOrReturnCtx(input, ctx) {
		return ctx || {
			common: input.parent.common,
			data: input.data,
			parsedType: getParsedType(input.data),
			schemaErrorMap: this._def.errorMap,
			path: input.path,
			parent: input.parent
		};
	}
	_processInputParams(input) {
		return {
			status: new ParseStatus(),
			ctx: {
				common: input.parent.common,
				data: input.data,
				parsedType: getParsedType(input.data),
				schemaErrorMap: this._def.errorMap,
				path: input.path,
				parent: input.parent
			}
		};
	}
	_parseSync(input) {
		const result = this._parse(input);
		if (isAsync(result)) throw new Error("Synchronous parse encountered promise.");
		return result;
	}
	_parseAsync(input) {
		const result = this._parse(input);
		return Promise.resolve(result);
	}
	parse(data, params) {
		const result = this.safeParse(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	safeParse(data, params) {
		const ctx = {
			common: {
				issues: [],
				async: params?.async ?? false,
				contextualErrorMap: params?.errorMap
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const result = this._parseSync({
			data,
			path: ctx.path,
			parent: ctx
		});
		return handleResult(ctx, result);
	}
	"~validate"(data) {
		const ctx = {
			common: {
				issues: [],
				async: !!this["~standard"].async
			},
			path: [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		if (!this["~standard"].async) try {
			const result = this._parseSync({
				data,
				path: [],
				parent: ctx
			});
			return isValid(result) ? { value: result.value } : { issues: ctx.common.issues };
		} catch (err$1) {
			if (err$1?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
			ctx.common = {
				issues: [],
				async: true
			};
		}
		return this._parseAsync({
			data,
			path: [],
			parent: ctx
		}).then((result) => isValid(result) ? { value: result.value } : { issues: ctx.common.issues });
	}
	async parseAsync(data, params) {
		const result = await this.safeParseAsync(data, params);
		if (result.success) return result.data;
		throw result.error;
	}
	async safeParseAsync(data, params) {
		const ctx = {
			common: {
				issues: [],
				contextualErrorMap: params?.errorMap,
				async: true
			},
			path: params?.path || [],
			schemaErrorMap: this._def.errorMap,
			parent: null,
			data,
			parsedType: getParsedType(data)
		};
		const maybeAsyncResult = this._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
		const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
		return handleResult(ctx, result);
	}
	refine(check, message) {
		const getIssueProperties = (val) => {
			if (typeof message === "string" || typeof message === "undefined") return { message };
			else if (typeof message === "function") return message(val);
			else return message;
		};
		return this._refinement((val, ctx) => {
			const result = check(val);
			const setError = () => ctx.addIssue({
				code: ZodIssueCode.custom,
				...getIssueProperties(val)
			});
			if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
				if (!data) {
					setError();
					return false;
				} else return true;
			});
			if (!result) {
				setError();
				return false;
			} else return true;
		});
	}
	refinement(check, refinementData) {
		return this._refinement((val, ctx) => {
			if (!check(val)) {
				ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
				return false;
			} else return true;
		});
	}
	_refinement(refinement) {
		return new ZodEffects({
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "refinement",
				refinement
			}
		});
	}
	superRefine(refinement) {
		return this._refinement(refinement);
	}
	constructor(def) {
		/** Alias of safeParseAsync */
		this.spa = this.safeParseAsync;
		this._def = def;
		this.parse = this.parse.bind(this);
		this.safeParse = this.safeParse.bind(this);
		this.parseAsync = this.parseAsync.bind(this);
		this.safeParseAsync = this.safeParseAsync.bind(this);
		this.spa = this.spa.bind(this);
		this.refine = this.refine.bind(this);
		this.refinement = this.refinement.bind(this);
		this.superRefine = this.superRefine.bind(this);
		this.optional = this.optional.bind(this);
		this.nullable = this.nullable.bind(this);
		this.nullish = this.nullish.bind(this);
		this.array = this.array.bind(this);
		this.promise = this.promise.bind(this);
		this.or = this.or.bind(this);
		this.and = this.and.bind(this);
		this.transform = this.transform.bind(this);
		this.brand = this.brand.bind(this);
		this.default = this.default.bind(this);
		this.catch = this.catch.bind(this);
		this.describe = this.describe.bind(this);
		this.pipe = this.pipe.bind(this);
		this.readonly = this.readonly.bind(this);
		this.isNullable = this.isNullable.bind(this);
		this.isOptional = this.isOptional.bind(this);
		this["~standard"] = {
			version: 1,
			vendor: "zod",
			validate: (data) => this["~validate"](data)
		};
	}
	optional() {
		return ZodOptional.create(this, this._def);
	}
	nullable() {
		return ZodNullable.create(this, this._def);
	}
	nullish() {
		return this.nullable().optional();
	}
	array() {
		return ZodArray.create(this);
	}
	promise() {
		return ZodPromise.create(this, this._def);
	}
	or(option) {
		return ZodUnion.create([this, option], this._def);
	}
	and(incoming) {
		return ZodIntersection.create(this, incoming, this._def);
	}
	transform(transform) {
		return new ZodEffects({
			...processCreateParams(this._def),
			schema: this,
			typeName: ZodFirstPartyTypeKind.ZodEffects,
			effect: {
				type: "transform",
				transform
			}
		});
	}
	default(def) {
		const defaultValueFunc = typeof def === "function" ? def : () => def;
		return new ZodDefault({
			...processCreateParams(this._def),
			innerType: this,
			defaultValue: defaultValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodDefault
		});
	}
	brand() {
		return new ZodBranded({
			typeName: ZodFirstPartyTypeKind.ZodBranded,
			type: this,
			...processCreateParams(this._def)
		});
	}
	catch(def) {
		const catchValueFunc = typeof def === "function" ? def : () => def;
		return new ZodCatch({
			...processCreateParams(this._def),
			innerType: this,
			catchValue: catchValueFunc,
			typeName: ZodFirstPartyTypeKind.ZodCatch
		});
	}
	describe(description) {
		const This = this.constructor;
		return new This({
			...this._def,
			description
		});
	}
	pipe(target) {
		return ZodPipeline.create(this, target);
	}
	readonly() {
		return ZodReadonly.create(this);
	}
	isOptional() {
		return this.safeParse(void 0).success;
	}
	isNullable() {
		return this.safeParse(null).success;
	}
};
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
	let secondsRegexSource = `[0-5]\\d`;
	if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
	else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
	const secondsQuantifier = args.precision ? "+" : "?";
	return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
	return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
	let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
	const opts = [];
	opts.push(args.local ? `Z?` : `Z`);
	if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
	regex = `${regex}(${opts.join("|")})`;
	return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
	if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
	return false;
}
function isValidJWT(jwt, alg) {
	if (!jwtRegex.test(jwt)) return false;
	try {
		const [header] = jwt.split(".");
		if (!header) return false;
		const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
		const decoded = JSON.parse(atob(base64));
		if (typeof decoded !== "object" || decoded === null) return false;
		if ("typ" in decoded && decoded?.typ !== "JWT") return false;
		if (!decoded.alg) return false;
		if (alg && decoded.alg !== alg) return false;
		return true;
	} catch {
		return false;
	}
}
function isValidCidr(ip, version) {
	if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
	if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
	return false;
}
var ZodString = class ZodString extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = String(input.data);
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.string) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.string,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.length < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.length > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "length") {
			const tooBig = input.data.length > check.value;
			const tooSmall = input.data.length < check.value;
			if (tooBig || tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				if (tooBig) addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				else if (tooSmall) addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "string",
					inclusive: true,
					exact: true,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "email") {
			if (!emailRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "email",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "emoji") {
			if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
			if (!emojiRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "emoji",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "uuid") {
			if (!uuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "uuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "nanoid") {
			if (!nanoidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "nanoid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid") {
			if (!cuidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cuid2") {
			if (!cuid2Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cuid2",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ulid") {
			if (!ulidRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ulid",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "url") try {
			new URL(input.data);
		} catch {
			ctx = this._getOrReturnCtx(input, ctx);
			addIssueToContext(ctx, {
				validation: "url",
				code: ZodIssueCode.invalid_string,
				message: check.message
			});
			status.dirty();
		}
		else if (check.kind === "regex") {
			check.regex.lastIndex = 0;
			const testResult = check.regex.test(input.data);
			if (!testResult) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "regex",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "trim") input.data = input.data.trim();
		else if (check.kind === "includes") {
			if (!input.data.includes(check.value, check.position)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: {
						includes: check.value,
						position: check.position
					},
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
		else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
		else if (check.kind === "startsWith") {
			if (!input.data.startsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { startsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "endsWith") {
			if (!input.data.endsWith(check.value)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: { endsWith: check.value },
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "datetime") {
			const regex = datetimeRegex(check);
			if (!regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "datetime",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "date") {
			const regex = dateRegex;
			if (!regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "date",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "time") {
			const regex = timeRegex(check);
			if (!regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_string,
					validation: "time",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "duration") {
			if (!durationRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "duration",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "ip") {
			if (!isValidIP(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "ip",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "jwt") {
			if (!isValidJWT(input.data, check.alg)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "jwt",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "cidr") {
			if (!isValidCidr(input.data, check.version)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "cidr",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64") {
			if (!base64Regex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "base64url") {
			if (!base64urlRegex.test(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					validation: "base64url",
					code: ZodIssueCode.invalid_string,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_regex(regex, validation, message) {
		return this.refinement((data) => regex.test(data), {
			validation,
			code: ZodIssueCode.invalid_string,
			...errorUtil.errToObj(message)
		});
	}
	_addCheck(check) {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	email(message) {
		return this._addCheck({
			kind: "email",
			...errorUtil.errToObj(message)
		});
	}
	url(message) {
		return this._addCheck({
			kind: "url",
			...errorUtil.errToObj(message)
		});
	}
	emoji(message) {
		return this._addCheck({
			kind: "emoji",
			...errorUtil.errToObj(message)
		});
	}
	uuid(message) {
		return this._addCheck({
			kind: "uuid",
			...errorUtil.errToObj(message)
		});
	}
	nanoid(message) {
		return this._addCheck({
			kind: "nanoid",
			...errorUtil.errToObj(message)
		});
	}
	cuid(message) {
		return this._addCheck({
			kind: "cuid",
			...errorUtil.errToObj(message)
		});
	}
	cuid2(message) {
		return this._addCheck({
			kind: "cuid2",
			...errorUtil.errToObj(message)
		});
	}
	ulid(message) {
		return this._addCheck({
			kind: "ulid",
			...errorUtil.errToObj(message)
		});
	}
	base64(message) {
		return this._addCheck({
			kind: "base64",
			...errorUtil.errToObj(message)
		});
	}
	base64url(message) {
		return this._addCheck({
			kind: "base64url",
			...errorUtil.errToObj(message)
		});
	}
	jwt(options) {
		return this._addCheck({
			kind: "jwt",
			...errorUtil.errToObj(options)
		});
	}
	ip(options) {
		return this._addCheck({
			kind: "ip",
			...errorUtil.errToObj(options)
		});
	}
	cidr(options) {
		return this._addCheck({
			kind: "cidr",
			...errorUtil.errToObj(options)
		});
	}
	datetime(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "datetime",
			precision: null,
			offset: false,
			local: false,
			message: options
		});
		return this._addCheck({
			kind: "datetime",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			offset: options?.offset ?? false,
			local: options?.local ?? false,
			...errorUtil.errToObj(options?.message)
		});
	}
	date(message) {
		return this._addCheck({
			kind: "date",
			message
		});
	}
	time(options) {
		if (typeof options === "string") return this._addCheck({
			kind: "time",
			precision: null,
			message: options
		});
		return this._addCheck({
			kind: "time",
			precision: typeof options?.precision === "undefined" ? null : options?.precision,
			...errorUtil.errToObj(options?.message)
		});
	}
	duration(message) {
		return this._addCheck({
			kind: "duration",
			...errorUtil.errToObj(message)
		});
	}
	regex(regex, message) {
		return this._addCheck({
			kind: "regex",
			regex,
			...errorUtil.errToObj(message)
		});
	}
	includes(value, options) {
		return this._addCheck({
			kind: "includes",
			value,
			position: options?.position,
			...errorUtil.errToObj(options?.message)
		});
	}
	startsWith(value, message) {
		return this._addCheck({
			kind: "startsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	endsWith(value, message) {
		return this._addCheck({
			kind: "endsWith",
			value,
			...errorUtil.errToObj(message)
		});
	}
	min(minLength, message) {
		return this._addCheck({
			kind: "min",
			value: minLength,
			...errorUtil.errToObj(message)
		});
	}
	max(maxLength, message) {
		return this._addCheck({
			kind: "max",
			value: maxLength,
			...errorUtil.errToObj(message)
		});
	}
	length(len, message) {
		return this._addCheck({
			kind: "length",
			value: len,
			...errorUtil.errToObj(message)
		});
	}
	/**
	* Equivalent to `.min(1)`
	*/
	nonempty(message) {
		return this.min(1, errorUtil.errToObj(message));
	}
	trim() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "trim" }]
		});
	}
	toLowerCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toLowerCase" }]
		});
	}
	toUpperCase() {
		return new ZodString({
			...this._def,
			checks: [...this._def.checks, { kind: "toUpperCase" }]
		});
	}
	get isDatetime() {
		return !!this._def.checks.find((ch) => ch.kind === "datetime");
	}
	get isDate() {
		return !!this._def.checks.find((ch) => ch.kind === "date");
	}
	get isTime() {
		return !!this._def.checks.find((ch) => ch.kind === "time");
	}
	get isDuration() {
		return !!this._def.checks.find((ch) => ch.kind === "duration");
	}
	get isEmail() {
		return !!this._def.checks.find((ch) => ch.kind === "email");
	}
	get isURL() {
		return !!this._def.checks.find((ch) => ch.kind === "url");
	}
	get isEmoji() {
		return !!this._def.checks.find((ch) => ch.kind === "emoji");
	}
	get isUUID() {
		return !!this._def.checks.find((ch) => ch.kind === "uuid");
	}
	get isNANOID() {
		return !!this._def.checks.find((ch) => ch.kind === "nanoid");
	}
	get isCUID() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid");
	}
	get isCUID2() {
		return !!this._def.checks.find((ch) => ch.kind === "cuid2");
	}
	get isULID() {
		return !!this._def.checks.find((ch) => ch.kind === "ulid");
	}
	get isIP() {
		return !!this._def.checks.find((ch) => ch.kind === "ip");
	}
	get isCIDR() {
		return !!this._def.checks.find((ch) => ch.kind === "cidr");
	}
	get isBase64() {
		return !!this._def.checks.find((ch) => ch.kind === "base64");
	}
	get isBase64url() {
		return !!this._def.checks.find((ch) => ch.kind === "base64url");
	}
	get minLength() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxLength() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodString.create = (params) => {
	return new ZodString({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodString,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepDecCount = (step.toString().split(".")[1] || "").length;
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
	const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
	return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class ZodNumber extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
		this.step = this.multipleOf;
	}
	_parse(input) {
		if (this._def.coerce) input.data = Number(input.data);
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.number) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.number,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "int") {
			if (!util.isInteger(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.invalid_type,
					expected: "integer",
					received: "float",
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "min") {
			const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
			if (tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
			if (tooBig) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: check.value,
					type: "number",
					inclusive: check.inclusive,
					exact: false,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (floatSafeRemainder(input.data, check.value) !== 0) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "finite") {
			if (!Number.isFinite(input.data)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_finite,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodNumber({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	int(message) {
		return this._addCheck({
			kind: "int",
			message: errorUtil.toString(message)
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: 0,
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	finite(message) {
		return this._addCheck({
			kind: "finite",
			message: errorUtil.toString(message)
		});
	}
	safe(message) {
		return this._addCheck({
			kind: "min",
			inclusive: true,
			value: Number.MIN_SAFE_INTEGER,
			message: errorUtil.toString(message)
		})._addCheck({
			kind: "max",
			inclusive: true,
			value: Number.MAX_SAFE_INTEGER,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
	get isInt() {
		return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
	}
	get isFinite() {
		let max = null;
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
		else if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		} else if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return Number.isFinite(min) && Number.isFinite(max);
	}
};
ZodNumber.create = (params) => {
	return new ZodNumber({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodNumber,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodBigInt = class ZodBigInt extends ZodType {
	constructor() {
		super(...arguments);
		this.min = this.gte;
		this.max = this.lte;
	}
	_parse(input) {
		if (this._def.coerce) try {
			input.data = BigInt(input.data);
		} catch {
			return this._getInvalidInput(input);
		}
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.bigint) return this._getInvalidInput(input);
		let ctx = void 0;
		const status = new ParseStatus();
		for (const check of this._def.checks) if (check.kind === "min") {
			const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
			if (tooSmall) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					type: "bigint",
					minimum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
			if (tooBig) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					type: "bigint",
					maximum: check.value,
					inclusive: check.inclusive,
					message: check.message
				});
				status.dirty();
			}
		} else if (check.kind === "multipleOf") {
			if (input.data % check.value !== BigInt(0)) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.not_multiple_of,
					multipleOf: check.value,
					message: check.message
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: input.data
		};
	}
	_getInvalidInput(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.bigint,
			received: ctx.parsedType
		});
		return INVALID;
	}
	gte(value, message) {
		return this.setLimit("min", value, true, errorUtil.toString(message));
	}
	gt(value, message) {
		return this.setLimit("min", value, false, errorUtil.toString(message));
	}
	lte(value, message) {
		return this.setLimit("max", value, true, errorUtil.toString(message));
	}
	lt(value, message) {
		return this.setLimit("max", value, false, errorUtil.toString(message));
	}
	setLimit(kind, value, inclusive, message) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, {
				kind,
				value,
				inclusive,
				message: errorUtil.toString(message)
			}]
		});
	}
	_addCheck(check) {
		return new ZodBigInt({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	positive(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	negative(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: false,
			message: errorUtil.toString(message)
		});
	}
	nonpositive(message) {
		return this._addCheck({
			kind: "max",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	nonnegative(message) {
		return this._addCheck({
			kind: "min",
			value: BigInt(0),
			inclusive: true,
			message: errorUtil.toString(message)
		});
	}
	multipleOf(value, message) {
		return this._addCheck({
			kind: "multipleOf",
			value,
			message: errorUtil.toString(message)
		});
	}
	get minValue() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min;
	}
	get maxValue() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max;
	}
};
ZodBigInt.create = (params) => {
	return new ZodBigInt({
		checks: [],
		typeName: ZodFirstPartyTypeKind.ZodBigInt,
		coerce: params?.coerce ?? false,
		...processCreateParams(params)
	});
};
var ZodBoolean = class extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = Boolean(input.data);
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.boolean) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.boolean,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodBoolean.create = (params) => {
	return new ZodBoolean({
		typeName: ZodFirstPartyTypeKind.ZodBoolean,
		coerce: params?.coerce || false,
		...processCreateParams(params)
	});
};
var ZodDate = class ZodDate extends ZodType {
	_parse(input) {
		if (this._def.coerce) input.data = new Date(input.data);
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.date) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.date,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		if (Number.isNaN(input.data.getTime())) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, { code: ZodIssueCode.invalid_date });
			return INVALID;
		}
		const status = new ParseStatus();
		let ctx = void 0;
		for (const check of this._def.checks) if (check.kind === "min") {
			if (input.data.getTime() < check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					message: check.message,
					inclusive: true,
					exact: false,
					minimum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else if (check.kind === "max") {
			if (input.data.getTime() > check.value) {
				ctx = this._getOrReturnCtx(input, ctx);
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					message: check.message,
					inclusive: true,
					exact: false,
					maximum: check.value,
					type: "date"
				});
				status.dirty();
			}
		} else util.assertNever(check);
		return {
			status: status.value,
			value: new Date(input.data.getTime())
		};
	}
	_addCheck(check) {
		return new ZodDate({
			...this._def,
			checks: [...this._def.checks, check]
		});
	}
	min(minDate, message) {
		return this._addCheck({
			kind: "min",
			value: minDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	max(maxDate, message) {
		return this._addCheck({
			kind: "max",
			value: maxDate.getTime(),
			message: errorUtil.toString(message)
		});
	}
	get minDate() {
		let min = null;
		for (const ch of this._def.checks) if (ch.kind === "min") {
			if (min === null || ch.value > min) min = ch.value;
		}
		return min != null ? new Date(min) : null;
	}
	get maxDate() {
		let max = null;
		for (const ch of this._def.checks) if (ch.kind === "max") {
			if (max === null || ch.value < max) max = ch.value;
		}
		return max != null ? new Date(max) : null;
	}
};
ZodDate.create = (params) => {
	return new ZodDate({
		checks: [],
		coerce: params?.coerce || false,
		typeName: ZodFirstPartyTypeKind.ZodDate,
		...processCreateParams(params)
	});
};
var ZodSymbol = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.symbol) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.symbol,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodSymbol.create = (params) => {
	return new ZodSymbol({
		typeName: ZodFirstPartyTypeKind.ZodSymbol,
		...processCreateParams(params)
	});
};
var ZodUndefined = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.undefined,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodUndefined.create = (params) => {
	return new ZodUndefined({
		typeName: ZodFirstPartyTypeKind.ZodUndefined,
		...processCreateParams(params)
	});
};
var ZodNull = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.null) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.null,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodNull.create = (params) => {
	return new ZodNull({
		typeName: ZodFirstPartyTypeKind.ZodNull,
		...processCreateParams(params)
	});
};
var ZodAny = class extends ZodType {
	constructor() {
		super(...arguments);
		this._any = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodAny.create = (params) => {
	return new ZodAny({
		typeName: ZodFirstPartyTypeKind.ZodAny,
		...processCreateParams(params)
	});
};
var ZodUnknown = class extends ZodType {
	constructor() {
		super(...arguments);
		this._unknown = true;
	}
	_parse(input) {
		return OK(input.data);
	}
};
ZodUnknown.create = (params) => {
	return new ZodUnknown({
		typeName: ZodFirstPartyTypeKind.ZodUnknown,
		...processCreateParams(params)
	});
};
var ZodNever = class extends ZodType {
	_parse(input) {
		const ctx = this._getOrReturnCtx(input);
		addIssueToContext(ctx, {
			code: ZodIssueCode.invalid_type,
			expected: ZodParsedType.never,
			received: ctx.parsedType
		});
		return INVALID;
	}
};
ZodNever.create = (params) => {
	return new ZodNever({
		typeName: ZodFirstPartyTypeKind.ZodNever,
		...processCreateParams(params)
	});
};
var ZodVoid = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.undefined) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.void,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return OK(input.data);
	}
};
ZodVoid.create = (params) => {
	return new ZodVoid({
		typeName: ZodFirstPartyTypeKind.ZodVoid,
		...processCreateParams(params)
	});
};
var ZodArray = class ZodArray extends ZodType {
	_parse(input) {
		const { ctx, status } = this._processInputParams(input);
		const def = this._def;
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (def.exactLength !== null) {
			const tooBig = ctx.data.length > def.exactLength.value;
			const tooSmall = ctx.data.length < def.exactLength.value;
			if (tooBig || tooSmall) {
				addIssueToContext(ctx, {
					code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
					minimum: tooSmall ? def.exactLength.value : void 0,
					maximum: tooBig ? def.exactLength.value : void 0,
					type: "array",
					inclusive: true,
					exact: true,
					message: def.exactLength.message
				});
				status.dirty();
			}
		}
		if (def.minLength !== null) {
			if (ctx.data.length < def.minLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.minLength.message
				});
				status.dirty();
			}
		}
		if (def.maxLength !== null) {
			if (ctx.data.length > def.maxLength.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxLength.value,
					type: "array",
					inclusive: true,
					exact: false,
					message: def.maxLength.message
				});
				status.dirty();
			}
		}
		if (ctx.common.async) return Promise.all([...ctx.data].map((item, i$2) => {
			return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i$2));
		})).then((result$1) => {
			return ParseStatus.mergeArray(status, result$1);
		});
		const result = [...ctx.data].map((item, i$2) => {
			return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i$2));
		});
		return ParseStatus.mergeArray(status, result);
	}
	get element() {
		return this._def.type;
	}
	min(minLength, message) {
		return new ZodArray({
			...this._def,
			minLength: {
				value: minLength,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxLength, message) {
		return new ZodArray({
			...this._def,
			maxLength: {
				value: maxLength,
				message: errorUtil.toString(message)
			}
		});
	}
	length(len, message) {
		return new ZodArray({
			...this._def,
			exactLength: {
				value: len,
				message: errorUtil.toString(message)
			}
		});
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodArray.create = (schema$1, params) => {
	return new ZodArray({
		type: schema$1,
		minLength: null,
		maxLength: null,
		exactLength: null,
		typeName: ZodFirstPartyTypeKind.ZodArray,
		...processCreateParams(params)
	});
};
function deepPartialify(schema$1) {
	if (schema$1 instanceof ZodObject) {
		const newShape = {};
		for (const key in schema$1.shape) {
			const fieldSchema = schema$1.shape[key];
			newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
		}
		return new ZodObject({
			...schema$1._def,
			shape: () => newShape
		});
	} else if (schema$1 instanceof ZodArray) return new ZodArray({
		...schema$1._def,
		type: deepPartialify(schema$1.element)
	});
	else if (schema$1 instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema$1.unwrap()));
	else if (schema$1 instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema$1.unwrap()));
	else if (schema$1 instanceof ZodTuple) return ZodTuple.create(schema$1.items.map((item) => deepPartialify(item)));
	else return schema$1;
}
var ZodObject = class ZodObject extends ZodType {
	constructor() {
		super(...arguments);
		this._cached = null;
		/**
		* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
		* If you want to pass through unknown properties, use `.passthrough()` instead.
		*/
		this.nonstrict = this.passthrough;
		/**
		* @deprecated Use `.extend` instead
		*  */
		this.augment = this.extend;
	}
	_getCached() {
		if (this._cached !== null) return this._cached;
		const shape = this._def.shape();
		const keys = util.objectKeys(shape);
		this._cached = {
			shape,
			keys
		};
		return this._cached;
	}
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.object) {
			const ctx$1 = this._getOrReturnCtx(input);
			addIssueToContext(ctx$1, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx$1.parsedType
			});
			return INVALID;
		}
		const { status, ctx } = this._processInputParams(input);
		const { shape, keys: shapeKeys } = this._getCached();
		const extraKeys = [];
		if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
			for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
		}
		const pairs$1 = [];
		for (const key of shapeKeys) {
			const keyValidator = shape[key];
			const value = ctx.data[key];
			pairs$1.push({
				key: {
					status: "valid",
					value: key
				},
				value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
				alwaysSet: key in ctx.data
			});
		}
		if (this._def.catchall instanceof ZodNever) {
			const unknownKeys = this._def.unknownKeys;
			if (unknownKeys === "passthrough") for (const key of extraKeys) pairs$1.push({
				key: {
					status: "valid",
					value: key
				},
				value: {
					status: "valid",
					value: ctx.data[key]
				}
			});
			else if (unknownKeys === "strict") {
				if (extraKeys.length > 0) {
					addIssueToContext(ctx, {
						code: ZodIssueCode.unrecognized_keys,
						keys: extraKeys
					});
					status.dirty();
				}
			} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
		} else {
			const catchall = this._def.catchall;
			for (const key of extraKeys) {
				const value = ctx.data[key];
				pairs$1.push({
					key: {
						status: "valid",
						value: key
					},
					value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
					alwaysSet: key in ctx.data
				});
			}
		}
		if (ctx.common.async) return Promise.resolve().then(async () => {
			const syncPairs = [];
			for (const pair of pairs$1) {
				const key = await pair.key;
				const value = await pair.value;
				syncPairs.push({
					key,
					value,
					alwaysSet: pair.alwaysSet
				});
			}
			return syncPairs;
		}).then((syncPairs) => {
			return ParseStatus.mergeObjectSync(status, syncPairs);
		});
		else return ParseStatus.mergeObjectSync(status, pairs$1);
	}
	get shape() {
		return this._def.shape();
	}
	strict(message) {
		errorUtil.errToObj;
		return new ZodObject({
			...this._def,
			unknownKeys: "strict",
			...message !== void 0 ? { errorMap: (issue, ctx) => {
				const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
				if (issue.code === "unrecognized_keys") return { message: errorUtil.errToObj(message).message ?? defaultError };
				return { message: defaultError };
			} } : {}
		});
	}
	strip() {
		return new ZodObject({
			...this._def,
			unknownKeys: "strip"
		});
	}
	passthrough() {
		return new ZodObject({
			...this._def,
			unknownKeys: "passthrough"
		});
	}
	extend(augmentation) {
		return new ZodObject({
			...this._def,
			shape: () => ({
				...this._def.shape(),
				...augmentation
			})
		});
	}
	/**
	* Prior to zod@1.0.12 there was a bug in the
	* inferred type of merged objects. Please
	* upgrade if you are experiencing issues.
	*/
	merge(merging) {
		const merged = new ZodObject({
			unknownKeys: merging._def.unknownKeys,
			catchall: merging._def.catchall,
			shape: () => ({
				...this._def.shape(),
				...merging._def.shape()
			}),
			typeName: ZodFirstPartyTypeKind.ZodObject
		});
		return merged;
	}
	setKey(key, schema$1) {
		return this.augment({ [key]: schema$1 });
	}
	catchall(index) {
		return new ZodObject({
			...this._def,
			catchall: index
		});
	}
	pick(mask) {
		const shape = {};
		for (const key of util.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	omit(mask) {
		const shape = {};
		for (const key of util.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
		return new ZodObject({
			...this._def,
			shape: () => shape
		});
	}
	/**
	* @deprecated
	*/
	deepPartial() {
		return deepPartialify(this);
	}
	partial(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) {
			const fieldSchema = this.shape[key];
			if (mask && !mask[key]) newShape[key] = fieldSchema;
			else newShape[key] = fieldSchema.optional();
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	required(mask) {
		const newShape = {};
		for (const key of util.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
		else {
			const fieldSchema = this.shape[key];
			let newField = fieldSchema;
			while (newField instanceof ZodOptional) newField = newField._def.innerType;
			newShape[key] = newField;
		}
		return new ZodObject({
			...this._def,
			shape: () => newShape
		});
	}
	keyof() {
		return createZodEnum(util.objectKeys(this.shape));
	}
};
ZodObject.create = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.strictCreate = (shape, params) => {
	return new ZodObject({
		shape: () => shape,
		unknownKeys: "strict",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
ZodObject.lazycreate = (shape, params) => {
	return new ZodObject({
		shape,
		unknownKeys: "strip",
		catchall: ZodNever.create(),
		typeName: ZodFirstPartyTypeKind.ZodObject,
		...processCreateParams(params)
	});
};
var ZodUnion = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const options = this._def.options;
		function handleResults(results) {
			for (const result of results) if (result.result.status === "valid") return result.result;
			for (const result of results) if (result.result.status === "dirty") {
				ctx.common.issues.push(...result.ctx.common.issues);
				return result.result;
			}
			const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
		if (ctx.common.async) return Promise.all(options.map(async (option) => {
			const childCtx = {
				...ctx,
				common: {
					...ctx.common,
					issues: []
				},
				parent: null
			};
			return {
				result: await option._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				}),
				ctx: childCtx
			};
		})).then(handleResults);
		else {
			let dirty = void 0;
			const issues = [];
			for (const option of options) {
				const childCtx = {
					...ctx,
					common: {
						...ctx.common,
						issues: []
					},
					parent: null
				};
				const result = option._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: childCtx
				});
				if (result.status === "valid") return result;
				else if (result.status === "dirty" && !dirty) dirty = {
					result,
					ctx: childCtx
				};
				if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
			}
			if (dirty) {
				ctx.common.issues.push(...dirty.ctx.common.issues);
				return dirty.result;
			}
			const unionErrors = issues.map((issues$1) => new ZodError(issues$1));
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union,
				unionErrors
			});
			return INVALID;
		}
	}
	get options() {
		return this._def.options;
	}
};
ZodUnion.create = (types, params) => {
	return new ZodUnion({
		options: types,
		typeName: ZodFirstPartyTypeKind.ZodUnion,
		...processCreateParams(params)
	});
};
const getDiscriminator = (type$1) => {
	if (type$1 instanceof ZodLazy) return getDiscriminator(type$1.schema);
	else if (type$1 instanceof ZodEffects) return getDiscriminator(type$1.innerType());
	else if (type$1 instanceof ZodLiteral) return [type$1.value];
	else if (type$1 instanceof ZodEnum) return type$1.options;
	else if (type$1 instanceof ZodNativeEnum) return util.objectValues(type$1.enum);
	else if (type$1 instanceof ZodDefault) return getDiscriminator(type$1._def.innerType);
	else if (type$1 instanceof ZodUndefined) return [void 0];
	else if (type$1 instanceof ZodNull) return [null];
	else if (type$1 instanceof ZodOptional) return [void 0, ...getDiscriminator(type$1.unwrap())];
	else if (type$1 instanceof ZodNullable) return [null, ...getDiscriminator(type$1.unwrap())];
	else if (type$1 instanceof ZodBranded) return getDiscriminator(type$1.unwrap());
	else if (type$1 instanceof ZodReadonly) return getDiscriminator(type$1.unwrap());
	else if (type$1 instanceof ZodCatch) return getDiscriminator(type$1._def.innerType);
	else return [];
};
var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const discriminator = this.discriminator;
		const discriminatorValue = ctx.data[discriminator];
		const option = this.optionsMap.get(discriminatorValue);
		if (!option) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_union_discriminator,
				options: Array.from(this.optionsMap.keys()),
				path: [discriminator]
			});
			return INVALID;
		}
		if (ctx.common.async) return option._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
		else return option._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
	get discriminator() {
		return this._def.discriminator;
	}
	get options() {
		return this._def.options;
	}
	get optionsMap() {
		return this._def.optionsMap;
	}
	/**
	* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
	* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
	* have a different value for each object in the union.
	* @param discriminator the name of the discriminator property
	* @param types an array of object schemas
	* @param params
	*/
	static create(discriminator, options, params) {
		const optionsMap = new Map();
		for (const type$1 of options) {
			const discriminatorValues = getDiscriminator(type$1.shape[discriminator]);
			if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
			for (const value of discriminatorValues) {
				if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
				optionsMap.set(value, type$1);
			}
		}
		return new ZodDiscriminatedUnion({
			typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
			discriminator,
			options,
			optionsMap,
			...processCreateParams(params)
		});
	}
};
function mergeValues(a, b) {
	const aType = getParsedType(a);
	const bType = getParsedType(b);
	if (a === b) return {
		valid: true,
		data: a
	};
	else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
		const bKeys = util.objectKeys(b);
		const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return { valid: false };
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	} else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
		if (a.length !== b.length) return { valid: false };
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return { valid: false };
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	} else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) return {
		valid: true,
		data: a
	};
	else return { valid: false };
}
var ZodIntersection = class extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const handleParsed = (parsedLeft, parsedRight) => {
			if (isAborted(parsedLeft) || isAborted(parsedRight)) return INVALID;
			const merged = mergeValues(parsedLeft.value, parsedRight.value);
			if (!merged.valid) {
				addIssueToContext(ctx, { code: ZodIssueCode.invalid_intersection_types });
				return INVALID;
			}
			if (isDirty(parsedLeft) || isDirty(parsedRight)) status.dirty();
			return {
				status: status.value,
				value: merged.data
			};
		};
		if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		})]).then(([left, right]) => handleParsed(left, right));
		else return handleParsed(this._def.left._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}), this._def.right._parseSync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}));
	}
};
ZodIntersection.create = (left, right, params) => {
	return new ZodIntersection({
		left,
		right,
		typeName: ZodFirstPartyTypeKind.ZodIntersection,
		...processCreateParams(params)
	});
};
var ZodTuple = class ZodTuple extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.array) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.array,
				received: ctx.parsedType
			});
			return INVALID;
		}
		if (ctx.data.length < this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_small,
				minimum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			return INVALID;
		}
		const rest = this._def.rest;
		if (!rest && ctx.data.length > this._def.items.length) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.too_big,
				maximum: this._def.items.length,
				inclusive: true,
				exact: false,
				type: "array"
			});
			status.dirty();
		}
		const items = [...ctx.data].map((item, itemIndex) => {
			const schema$1 = this._def.items[itemIndex] || this._def.rest;
			if (!schema$1) return null;
			return schema$1._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
		}).filter((x) => !!x);
		if (ctx.common.async) return Promise.all(items).then((results) => {
			return ParseStatus.mergeArray(status, results);
		});
		else return ParseStatus.mergeArray(status, items);
	}
	get items() {
		return this._def.items;
	}
	rest(rest) {
		return new ZodTuple({
			...this._def,
			rest
		});
	}
};
ZodTuple.create = (schemas, params) => {
	if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
	return new ZodTuple({
		items: schemas,
		typeName: ZodFirstPartyTypeKind.ZodTuple,
		rest: null,
		...processCreateParams(params)
	});
};
var ZodRecord = class ZodRecord extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.object) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.object,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const pairs$1 = [];
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		for (const key in ctx.data) pairs$1.push({
			key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
			value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
			alwaysSet: key in ctx.data
		});
		if (ctx.common.async) return ParseStatus.mergeObjectAsync(status, pairs$1);
		else return ParseStatus.mergeObjectSync(status, pairs$1);
	}
	get element() {
		return this._def.valueType;
	}
	static create(first, second, third) {
		if (second instanceof ZodType) return new ZodRecord({
			keyType: first,
			valueType: second,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(third)
		});
		return new ZodRecord({
			keyType: ZodString.create(),
			valueType: first,
			typeName: ZodFirstPartyTypeKind.ZodRecord,
			...processCreateParams(second)
		});
	}
};
var ZodMap = class extends ZodType {
	get keySchema() {
		return this._def.keyType;
	}
	get valueSchema() {
		return this._def.valueType;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.map) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.map,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const keyType = this._def.keyType;
		const valueType = this._def.valueType;
		const pairs$1 = [...ctx.data.entries()].map(([key, value], index) => {
			return {
				key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
				value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
			};
		});
		if (ctx.common.async) {
			const finalMap = new Map();
			return Promise.resolve().then(async () => {
				for (const pair of pairs$1) {
					const key = await pair.key;
					const value = await pair.value;
					if (key.status === "aborted" || value.status === "aborted") return INVALID;
					if (key.status === "dirty" || value.status === "dirty") status.dirty();
					finalMap.set(key.value, value.value);
				}
				return {
					status: status.value,
					value: finalMap
				};
			});
		} else {
			const finalMap = new Map();
			for (const pair of pairs$1) {
				const key = pair.key;
				const value = pair.value;
				if (key.status === "aborted" || value.status === "aborted") return INVALID;
				if (key.status === "dirty" || value.status === "dirty") status.dirty();
				finalMap.set(key.value, value.value);
			}
			return {
				status: status.value,
				value: finalMap
			};
		}
	}
};
ZodMap.create = (keyType, valueType, params) => {
	return new ZodMap({
		valueType,
		keyType,
		typeName: ZodFirstPartyTypeKind.ZodMap,
		...processCreateParams(params)
	});
};
var ZodSet = class ZodSet extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.set) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.set,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const def = this._def;
		if (def.minSize !== null) {
			if (ctx.data.size < def.minSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_small,
					minimum: def.minSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.minSize.message
				});
				status.dirty();
			}
		}
		if (def.maxSize !== null) {
			if (ctx.data.size > def.maxSize.value) {
				addIssueToContext(ctx, {
					code: ZodIssueCode.too_big,
					maximum: def.maxSize.value,
					type: "set",
					inclusive: true,
					exact: false,
					message: def.maxSize.message
				});
				status.dirty();
			}
		}
		const valueType = this._def.valueType;
		function finalizeSet(elements$1) {
			const parsedSet = new Set();
			for (const element of elements$1) {
				if (element.status === "aborted") return INVALID;
				if (element.status === "dirty") status.dirty();
				parsedSet.add(element.value);
			}
			return {
				status: status.value,
				value: parsedSet
			};
		}
		const elements = [...ctx.data.values()].map((item, i$2) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i$2)));
		if (ctx.common.async) return Promise.all(elements).then((elements$1) => finalizeSet(elements$1));
		else return finalizeSet(elements);
	}
	min(minSize, message) {
		return new ZodSet({
			...this._def,
			minSize: {
				value: minSize,
				message: errorUtil.toString(message)
			}
		});
	}
	max(maxSize, message) {
		return new ZodSet({
			...this._def,
			maxSize: {
				value: maxSize,
				message: errorUtil.toString(message)
			}
		});
	}
	size(size, message) {
		return this.min(size, message).max(size, message);
	}
	nonempty(message) {
		return this.min(1, message);
	}
};
ZodSet.create = (valueType, params) => {
	return new ZodSet({
		valueType,
		minSize: null,
		maxSize: null,
		typeName: ZodFirstPartyTypeKind.ZodSet,
		...processCreateParams(params)
	});
};
var ZodFunction = class ZodFunction extends ZodType {
	constructor() {
		super(...arguments);
		this.validate = this.implement;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.function) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.function,
				received: ctx.parsedType
			});
			return INVALID;
		}
		function makeArgsIssue(args, error$1) {
			return makeIssue({
				data: args,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_arguments,
					argumentsError: error$1
				}
			});
		}
		function makeReturnsIssue(returns, error$1) {
			return makeIssue({
				data: returns,
				path: ctx.path,
				errorMaps: [
					ctx.common.contextualErrorMap,
					ctx.schemaErrorMap,
					getErrorMap(),
					en_default
				].filter((x) => !!x),
				issueData: {
					code: ZodIssueCode.invalid_return_type,
					returnTypeError: error$1
				}
			});
		}
		const params = { errorMap: ctx.common.contextualErrorMap };
		const fn = ctx.data;
		if (this._def.returns instanceof ZodPromise) {
			const me = this;
			return OK(async function(...args) {
				const error$1 = new ZodError([]);
				const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
					error$1.addIssue(makeArgsIssue(args, e));
					throw error$1;
				});
				const result = await Reflect.apply(fn, this, parsedArgs);
				const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
					error$1.addIssue(makeReturnsIssue(result, e));
					throw error$1;
				});
				return parsedReturns;
			});
		} else {
			const me = this;
			return OK(function(...args) {
				const parsedArgs = me._def.args.safeParse(args, params);
				if (!parsedArgs.success) throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
				const result = Reflect.apply(fn, this, parsedArgs.data);
				const parsedReturns = me._def.returns.safeParse(result, params);
				if (!parsedReturns.success) throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
				return parsedReturns.data;
			});
		}
	}
	parameters() {
		return this._def.args;
	}
	returnType() {
		return this._def.returns;
	}
	args(...items) {
		return new ZodFunction({
			...this._def,
			args: ZodTuple.create(items).rest(ZodUnknown.create())
		});
	}
	returns(returnType) {
		return new ZodFunction({
			...this._def,
			returns: returnType
		});
	}
	implement(func) {
		const validatedFunc = this.parse(func);
		return validatedFunc;
	}
	strictImplement(func) {
		const validatedFunc = this.parse(func);
		return validatedFunc;
	}
	static create(args, returns, params) {
		return new ZodFunction({
			args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
			returns: returns || ZodUnknown.create(),
			typeName: ZodFirstPartyTypeKind.ZodFunction,
			...processCreateParams(params)
		});
	}
};
var ZodLazy = class extends ZodType {
	get schema() {
		return this._def.getter();
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const lazySchema = this._def.getter();
		return lazySchema._parse({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		});
	}
};
ZodLazy.create = (getter, params) => {
	return new ZodLazy({
		getter,
		typeName: ZodFirstPartyTypeKind.ZodLazy,
		...processCreateParams(params)
	});
};
var ZodLiteral = class extends ZodType {
	_parse(input) {
		if (input.data !== this._def.value) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_literal,
				expected: this._def.value
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
	get value() {
		return this._def.value;
	}
};
ZodLiteral.create = (value, params) => {
	return new ZodLiteral({
		value,
		typeName: ZodFirstPartyTypeKind.ZodLiteral,
		...processCreateParams(params)
	});
};
function createZodEnum(values, params) {
	return new ZodEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodEnum,
		...processCreateParams(params)
	});
}
var ZodEnum = class ZodEnum extends ZodType {
	_parse(input) {
		if (typeof input.data !== "string") {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(this._def.values);
		if (!this._cache.has(input.data)) {
			const ctx = this._getOrReturnCtx(input);
			const expectedValues = this._def.values;
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get options() {
		return this._def.values;
	}
	get enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Values() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	get Enum() {
		const enumValues = {};
		for (const val of this._def.values) enumValues[val] = val;
		return enumValues;
	}
	extract(values, newDef = this._def) {
		return ZodEnum.create(values, {
			...this._def,
			...newDef
		});
	}
	exclude(values, newDef = this._def) {
		return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
			...this._def,
			...newDef
		});
	}
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
	_parse(input) {
		const nativeEnumValues = util.getValidEnumValues(this._def.values);
		const ctx = this._getOrReturnCtx(input);
		if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				expected: util.joinValues(expectedValues),
				received: ctx.parsedType,
				code: ZodIssueCode.invalid_type
			});
			return INVALID;
		}
		if (!this._cache) this._cache = new Set(util.getValidEnumValues(this._def.values));
		if (!this._cache.has(input.data)) {
			const expectedValues = util.objectValues(nativeEnumValues);
			addIssueToContext(ctx, {
				received: ctx.data,
				code: ZodIssueCode.invalid_enum_value,
				options: expectedValues
			});
			return INVALID;
		}
		return OK(input.data);
	}
	get enum() {
		return this._def.values;
	}
};
ZodNativeEnum.create = (values, params) => {
	return new ZodNativeEnum({
		values,
		typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
		...processCreateParams(params)
	});
};
var ZodPromise = class extends ZodType {
	unwrap() {
		return this._def.type;
	}
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.promise,
				received: ctx.parsedType
			});
			return INVALID;
		}
		const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
		return OK(promisified.then((data) => {
			return this._def.type.parseAsync(data, {
				path: ctx.path,
				errorMap: ctx.common.contextualErrorMap
			});
		}));
	}
};
ZodPromise.create = (schema$1, params) => {
	return new ZodPromise({
		type: schema$1,
		typeName: ZodFirstPartyTypeKind.ZodPromise,
		...processCreateParams(params)
	});
};
var ZodEffects = class extends ZodType {
	innerType() {
		return this._def.schema;
	}
	sourceType() {
		return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
	}
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		const effect = this._def.effect || null;
		const checkCtx = {
			addIssue: (arg) => {
				addIssueToContext(ctx, arg);
				if (arg.fatal) status.abort();
				else status.dirty();
			},
			get path() {
				return ctx.path;
			}
		};
		checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
		if (effect.type === "preprocess") {
			const processed = effect.transform(ctx.data, checkCtx);
			if (ctx.common.async) return Promise.resolve(processed).then(async (processed$1) => {
				if (status.value === "aborted") return INVALID;
				const result = await this._def.schema._parseAsync({
					data: processed$1,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			});
			else {
				if (status.value === "aborted") return INVALID;
				const result = this._def.schema._parseSync({
					data: processed,
					path: ctx.path,
					parent: ctx
				});
				if (result.status === "aborted") return INVALID;
				if (result.status === "dirty") return DIRTY(result.value);
				if (status.value === "dirty") return DIRTY(result.value);
				return result;
			}
		}
		if (effect.type === "refinement") {
			const executeRefinement = (acc) => {
				const result = effect.refinement(acc, checkCtx);
				if (ctx.common.async) return Promise.resolve(result);
				if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
				return acc;
			};
			if (ctx.common.async === false) {
				const inner = this._def.schema._parseSync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				executeRefinement(inner.value);
				return {
					status: status.value,
					value: inner.value
				};
			} else return this._def.schema._parseAsync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			}).then((inner) => {
				if (inner.status === "aborted") return INVALID;
				if (inner.status === "dirty") status.dirty();
				return executeRefinement(inner.value).then(() => {
					return {
						status: status.value,
						value: inner.value
					};
				});
			});
		}
		if (effect.type === "transform") if (ctx.common.async === false) {
			const base = this._def.schema._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (!isValid(base)) return INVALID;
			const result = effect.transform(base.value, checkCtx);
			if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
			return {
				status: status.value,
				value: result
			};
		} else return this._def.schema._parseAsync({
			data: ctx.data,
			path: ctx.path,
			parent: ctx
		}).then((base) => {
			if (!isValid(base)) return INVALID;
			return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
				status: status.value,
				value: result
			}));
		});
		util.assertNever(effect);
	}
};
ZodEffects.create = (schema$1, effect, params) => {
	return new ZodEffects({
		schema: schema$1,
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		effect,
		...processCreateParams(params)
	});
};
ZodEffects.createWithPreprocess = (preprocess, schema$1, params) => {
	return new ZodEffects({
		schema: schema$1,
		effect: {
			type: "preprocess",
			transform: preprocess
		},
		typeName: ZodFirstPartyTypeKind.ZodEffects,
		...processCreateParams(params)
	});
};
var ZodOptional = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType === ZodParsedType.undefined) return OK(void 0);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodOptional.create = (type$1, params) => {
	return new ZodOptional({
		innerType: type$1,
		typeName: ZodFirstPartyTypeKind.ZodOptional,
		...processCreateParams(params)
	});
};
var ZodNullable = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType === ZodParsedType.null) return OK(null);
		return this._def.innerType._parse(input);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodNullable.create = (type$1, params) => {
	return new ZodNullable({
		innerType: type$1,
		typeName: ZodFirstPartyTypeKind.ZodNullable,
		...processCreateParams(params)
	});
};
var ZodDefault = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		let data = ctx.data;
		if (ctx.parsedType === ZodParsedType.undefined) data = this._def.defaultValue();
		return this._def.innerType._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	removeDefault() {
		return this._def.innerType;
	}
};
ZodDefault.create = (type$1, params) => {
	return new ZodDefault({
		innerType: type$1,
		typeName: ZodFirstPartyTypeKind.ZodDefault,
		defaultValue: typeof params.default === "function" ? params.default : () => params.default,
		...processCreateParams(params)
	});
};
var ZodCatch = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const newCtx = {
			...ctx,
			common: {
				...ctx.common,
				issues: []
			}
		};
		const result = this._def.innerType._parse({
			data: newCtx.data,
			path: newCtx.path,
			parent: { ...newCtx }
		});
		if (isAsync(result)) return result.then((result$1) => {
			return {
				status: "valid",
				value: result$1.status === "valid" ? result$1.value : this._def.catchValue({
					get error() {
						return new ZodError(newCtx.common.issues);
					},
					input: newCtx.data
				})
			};
		});
		else return {
			status: "valid",
			value: result.status === "valid" ? result.value : this._def.catchValue({
				get error() {
					return new ZodError(newCtx.common.issues);
				},
				input: newCtx.data
			})
		};
	}
	removeCatch() {
		return this._def.innerType;
	}
};
ZodCatch.create = (type$1, params) => {
	return new ZodCatch({
		innerType: type$1,
		typeName: ZodFirstPartyTypeKind.ZodCatch,
		catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
		...processCreateParams(params)
	});
};
var ZodNaN = class extends ZodType {
	_parse(input) {
		const parsedType = this._getType(input);
		if (parsedType !== ZodParsedType.nan) {
			const ctx = this._getOrReturnCtx(input);
			addIssueToContext(ctx, {
				code: ZodIssueCode.invalid_type,
				expected: ZodParsedType.nan,
				received: ctx.parsedType
			});
			return INVALID;
		}
		return {
			status: "valid",
			value: input.data
		};
	}
};
ZodNaN.create = (params) => {
	return new ZodNaN({
		typeName: ZodFirstPartyTypeKind.ZodNaN,
		...processCreateParams(params)
	});
};
const BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
	_parse(input) {
		const { ctx } = this._processInputParams(input);
		const data = ctx.data;
		return this._def.type._parse({
			data,
			path: ctx.path,
			parent: ctx
		});
	}
	unwrap() {
		return this._def.type;
	}
};
var ZodPipeline = class ZodPipeline extends ZodType {
	_parse(input) {
		const { status, ctx } = this._processInputParams(input);
		if (ctx.common.async) {
			const handleAsync = async () => {
				const inResult = await this._def.in._parseAsync({
					data: ctx.data,
					path: ctx.path,
					parent: ctx
				});
				if (inResult.status === "aborted") return INVALID;
				if (inResult.status === "dirty") {
					status.dirty();
					return DIRTY(inResult.value);
				} else return this._def.out._parseAsync({
					data: inResult.value,
					path: ctx.path,
					parent: ctx
				});
			};
			return handleAsync();
		} else {
			const inResult = this._def.in._parseSync({
				data: ctx.data,
				path: ctx.path,
				parent: ctx
			});
			if (inResult.status === "aborted") return INVALID;
			if (inResult.status === "dirty") {
				status.dirty();
				return {
					status: "dirty",
					value: inResult.value
				};
			} else return this._def.out._parseSync({
				data: inResult.value,
				path: ctx.path,
				parent: ctx
			});
		}
	}
	static create(a, b) {
		return new ZodPipeline({
			in: a,
			out: b,
			typeName: ZodFirstPartyTypeKind.ZodPipeline
		});
	}
};
var ZodReadonly = class extends ZodType {
	_parse(input) {
		const result = this._def.innerType._parse(input);
		const freeze = (data) => {
			if (isValid(data)) data.value = Object.freeze(data.value);
			return data;
		};
		return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
	}
	unwrap() {
		return this._def.innerType;
	}
};
ZodReadonly.create = (type$1, params) => {
	return new ZodReadonly({
		innerType: type$1,
		typeName: ZodFirstPartyTypeKind.ZodReadonly,
		...processCreateParams(params)
	});
};
const late = { object: ZodObject.lazycreate };
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind$1) {
	ZodFirstPartyTypeKind$1["ZodString"] = "ZodString";
	ZodFirstPartyTypeKind$1["ZodNumber"] = "ZodNumber";
	ZodFirstPartyTypeKind$1["ZodNaN"] = "ZodNaN";
	ZodFirstPartyTypeKind$1["ZodBigInt"] = "ZodBigInt";
	ZodFirstPartyTypeKind$1["ZodBoolean"] = "ZodBoolean";
	ZodFirstPartyTypeKind$1["ZodDate"] = "ZodDate";
	ZodFirstPartyTypeKind$1["ZodSymbol"] = "ZodSymbol";
	ZodFirstPartyTypeKind$1["ZodUndefined"] = "ZodUndefined";
	ZodFirstPartyTypeKind$1["ZodNull"] = "ZodNull";
	ZodFirstPartyTypeKind$1["ZodAny"] = "ZodAny";
	ZodFirstPartyTypeKind$1["ZodUnknown"] = "ZodUnknown";
	ZodFirstPartyTypeKind$1["ZodNever"] = "ZodNever";
	ZodFirstPartyTypeKind$1["ZodVoid"] = "ZodVoid";
	ZodFirstPartyTypeKind$1["ZodArray"] = "ZodArray";
	ZodFirstPartyTypeKind$1["ZodObject"] = "ZodObject";
	ZodFirstPartyTypeKind$1["ZodUnion"] = "ZodUnion";
	ZodFirstPartyTypeKind$1["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
	ZodFirstPartyTypeKind$1["ZodIntersection"] = "ZodIntersection";
	ZodFirstPartyTypeKind$1["ZodTuple"] = "ZodTuple";
	ZodFirstPartyTypeKind$1["ZodRecord"] = "ZodRecord";
	ZodFirstPartyTypeKind$1["ZodMap"] = "ZodMap";
	ZodFirstPartyTypeKind$1["ZodSet"] = "ZodSet";
	ZodFirstPartyTypeKind$1["ZodFunction"] = "ZodFunction";
	ZodFirstPartyTypeKind$1["ZodLazy"] = "ZodLazy";
	ZodFirstPartyTypeKind$1["ZodLiteral"] = "ZodLiteral";
	ZodFirstPartyTypeKind$1["ZodEnum"] = "ZodEnum";
	ZodFirstPartyTypeKind$1["ZodEffects"] = "ZodEffects";
	ZodFirstPartyTypeKind$1["ZodNativeEnum"] = "ZodNativeEnum";
	ZodFirstPartyTypeKind$1["ZodOptional"] = "ZodOptional";
	ZodFirstPartyTypeKind$1["ZodNullable"] = "ZodNullable";
	ZodFirstPartyTypeKind$1["ZodDefault"] = "ZodDefault";
	ZodFirstPartyTypeKind$1["ZodCatch"] = "ZodCatch";
	ZodFirstPartyTypeKind$1["ZodPromise"] = "ZodPromise";
	ZodFirstPartyTypeKind$1["ZodBranded"] = "ZodBranded";
	ZodFirstPartyTypeKind$1["ZodPipeline"] = "ZodPipeline";
	ZodFirstPartyTypeKind$1["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const coerce = {
	string: (arg) => ZodString.create({
		...arg,
		coerce: true
	}),
	number: (arg) => ZodNumber.create({
		...arg,
		coerce: true
	}),
	boolean: (arg) => ZodBoolean.create({
		...arg,
		coerce: true
	}),
	bigint: (arg) => ZodBigInt.create({
		...arg,
		coerce: true
	}),
	date: (arg) => ZodDate.create({
		...arg,
		coerce: true
	})
};

//#endregion
//#region src/cli/types.ts
/**
* Create a success result.
*
* @param data - The data to wrap in a success result.
* @returns A SuccessResult containing the data.
*/
function success(data) {
	return {
		success: true,
		data
	};
}
/**
* Create an error result.
*
* @param message - The error message.
* @returns An ErrorResult containing the message.
*/
function error(message) {
	return {
		error: true,
		message
	};
}
/**
* Check if a result is an error.
*
* @param result - The result to check.
* @returns True if the result is an error.
*/
function isError$1(result) {
	return "error" in result && result.error === true;
}
/**
* Zod schema for task ID argument.
*/
const taskIdSchema = stringType().min(1, "Task ID is required");
/**
* Zod schema for quick ID argument.
*/
const quickIdSchema = stringType().min(1, "Quick ID is required");
/**
* Zod schema for keyword arguments (search terms).
*/
const keywordsSchema = arrayType(stringType()).min(1, "At least one keyword is required");
/**
* Zod schema for optional min-score argument.
*/
const minScoreSchema = coerce.number().min(0).max(1).default(.3);
/**
* Zod schema for doc type filter.
*/
const docTypeSchema = enumType(["product", "engineering"]).optional();
/**
* Zod schema for context tier.
*/
const contextTierSchema = enumType([
	"minimal",
	"standard",
	"full"
]).default("standard");
/**
* Parse CLI arguments into positional args and flags.
*
* @param args - Raw argument array.
* @returns Parsed arguments with positional and flags separated.
*/
function parseArgs(args) {
	const positional = [];
	const flags = {};
	for (const arg of args) if (arg.startsWith("--")) {
		const [key, value] = arg.slice(2).split("=");
		flags[key] = value ?? true;
	} else positional.push(arg);
	return {
		positional,
		flags
	};
}
/**
* Get a string flag value.
*
* @param flags - The flags object.
* @param key - The flag key.
* @returns The string value or undefined.
*/
function getStringFlag(flags, key) {
	const value = flags[key];
	return typeof value === "string" ? value : void 0;
}
/**
* Get a number flag value.
*
* @param flags - The flags object.
* @param key - The flag key.
* @returns The number value or undefined.
*/
function getNumberFlag(flags, key) {
	const value = flags[key];
	if (typeof value === "string") {
		const num = parseFloat(value);
		return isNaN(num) ? void 0 : num;
	}
	return void 0;
}

//#endregion
//#region src/cli/registry.ts
/**
* Create a new command registry.
*
* @returns A new CommandRegistry instance.
*/
function createCommandRegistry() {
	const commands = new Map();
	function register(command) {
		if (commands.has(command.name)) throw new Error(`Command "${command.name}" is already registered`);
		commands.set(command.name, command);
	}
	function get(name) {
		return commands.get(name);
	}
	function list() {
		return Array.from(commands.values()).sort((a, b) => a.name.localeCompare(b.name));
	}
	function has(name) {
		return commands.has(name);
	}
	return {
		register,
		get,
		list,
		has
	};
}
/**
* Execute a command from the registry.
*
* @param registry - The command registry.
* @param commandName - The name of the command to execute.
* @param args - The arguments to pass to the command.
* @returns The result of the command execution.
*/
function executeCommand(registry, commandName, args) {
	const command = registry.get(commandName);
	if (!command) {
		const availableCommands = registry.list().map((c) => c.name);
		return error(`Unknown command: ${commandName}\n\nAvailable commands:\n${availableCommands.map((c) => `  ${c}`).join("\n")}`);
	}
	return command.handler(args);
}
/**
* Create a command definition helper.
*
* @param name - Command name.
* @param description - Command description.
* @param usage - Usage string.
* @param handler - Handler function.
* @returns A CliCommand object.
*/
function defineCommand(name, description, usage, handler) {
	return {
		name,
		description,
		usage,
		handler
	};
}

//#endregion
//#region src/cli/handlers/config.handler.ts
const CONFIG_FILE = ".festinalente/config.yaml";
const DIRECTIVES_DIR$1 = ".festinalente/directives";
const GLOSSARY_FILE = ".festinalente/glossary.yaml";
/**
* Create a config handler.
*
* @param deps - The dependencies.
* @returns A ConfigHandler instance.
*/
function createConfigHandler(deps) {
	const { fs: fs$3, yamlParser } = deps;
	/**
	* Get skill config command.
	*/
	function getSkillConfig(args) {
		const parsed = parseArgs(args);
		if (parsed.positional.length === 0) return error("Usage: get-skill-config <skill> (e.g., festina-implement)");
		const skillName = parsed.positional[0];
		if (!fs$3.exists(CONFIG_FILE)) return error(`${CONFIG_FILE} not found. Run npx festinalente first.`);
		const readResult = fs$3.readFile(CONFIG_FILE);
		if (!readResult.ok) return error(`Failed to read ${CONFIG_FILE}: ${readResult.error.message}`);
		let config;
		try {
			config = yamlParser.parseYaml(readResult.value);
		} catch (err$1) {
			return error(`Failed to parse ${CONFIG_FILE}: ${err$1 instanceof Error ? err$1.message : String(err$1)}`);
		}
		const directivesConfig = config.directives;
		if (!directivesConfig) return success({
			skill: skillName,
			directives: []
		});
		const skillDirectives = directivesConfig[skillName];
		if (!skillDirectives || !Array.isArray(skillDirectives)) return success({
			skill: skillName,
			directives: []
		});
		const directives = skillDirectives.map((name) => {
			const path$2 = fs$3.joinPath(DIRECTIVES_DIR$1, `${name}.xml`).replace(/\\/g, "/");
			return {
				name,
				path: path$2,
				exists: fs$3.exists(path$2)
			};
		});
		return success({
			skill: skillName,
			directives
		});
	}
	/**
	* Get date time command.
	*/
	function getDateTime(_args) {
		const now = new Date();
		return success({
			iso: now.toISOString(),
			date: now.toISOString().split("T")[0]
		});
	}
	/**
	* Load glossary from file.
	*/
	function loadGlossary() {
		if (!fs$3.exists(GLOSSARY_FILE)) return null;
		const readResult = fs$3.readFile(GLOSSARY_FILE);
		if (!readResult.ok) return null;
		try {
			return yamlParser.parseYaml(readResult.value);
		} catch {
			return null;
		}
	}
	/**
	* Expand query using glossary.
	*/
	function expandQuery(args) {
		const parsed = parseArgs(args);
		const terms = parsed.positional;
		if (terms.length === 0) return error("Usage: expand-query keyword1 keyword2 ...");
		const glossary = loadGlossary();
		if (!glossary || !glossary.terms || glossary.terms.length === 0) return success({
			original: terms,
			expanded: terms,
			glossaryMatches: []
		});
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
		return success({
			original: terms,
			expanded: Array.from(expanded),
			glossaryMatches: matches
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("get-skill-config", "Get skill configuration and directives", "get-skill-config <skill>", getSkillConfig),
			defineCommand("get-date-time", "Get formatted date-time strings", "get-date-time", getDateTime),
			defineCommand("expand-query", "Expand search query using glossary", "expand-query keyword1 keyword2 ...", expandQuery)
		];
	}
	return {
		getSkillConfig,
		getDateTime,
		expandQuery,
		getCommands
	};
}

//#endregion
//#region ../../node_modules/.pnpm/slugify@1.6.6/node_modules/slugify/slugify.js
var require_slugify = __commonJS({ "../../node_modules/.pnpm/slugify@1.6.6/node_modules/slugify/slugify.js"(exports, module) {
	(function(name, root, factory) {
		if (typeof exports === "object") {
			module.exports = factory();
			module.exports["default"] = factory();
		} else if (typeof define === "function" && define.amd) define(factory);
		else root[name] = factory();
	})("slugify", void 0, function() {
		var charMap = JSON.parse("{\"$\":\"dollar\",\"%\":\"percent\",\"&\":\"and\",\"<\":\"less\",\">\":\"greater\",\"|\":\"or\",\"¢\":\"cent\",\"£\":\"pound\",\"¤\":\"currency\",\"¥\":\"yen\",\"©\":\"(c)\",\"ª\":\"a\",\"®\":\"(r)\",\"º\":\"o\",\"À\":\"A\",\"Á\":\"A\",\"Â\":\"A\",\"Ã\":\"A\",\"Ä\":\"A\",\"Å\":\"A\",\"Æ\":\"AE\",\"Ç\":\"C\",\"È\":\"E\",\"É\":\"E\",\"Ê\":\"E\",\"Ë\":\"E\",\"Ì\":\"I\",\"Í\":\"I\",\"Î\":\"I\",\"Ï\":\"I\",\"Ð\":\"D\",\"Ñ\":\"N\",\"Ò\":\"O\",\"Ó\":\"O\",\"Ô\":\"O\",\"Õ\":\"O\",\"Ö\":\"O\",\"Ø\":\"O\",\"Ù\":\"U\",\"Ú\":\"U\",\"Û\":\"U\",\"Ü\":\"U\",\"Ý\":\"Y\",\"Þ\":\"TH\",\"ß\":\"ss\",\"à\":\"a\",\"á\":\"a\",\"â\":\"a\",\"ã\":\"a\",\"ä\":\"a\",\"å\":\"a\",\"æ\":\"ae\",\"ç\":\"c\",\"è\":\"e\",\"é\":\"e\",\"ê\":\"e\",\"ë\":\"e\",\"ì\":\"i\",\"í\":\"i\",\"î\":\"i\",\"ï\":\"i\",\"ð\":\"d\",\"ñ\":\"n\",\"ò\":\"o\",\"ó\":\"o\",\"ô\":\"o\",\"õ\":\"o\",\"ö\":\"o\",\"ø\":\"o\",\"ù\":\"u\",\"ú\":\"u\",\"û\":\"u\",\"ü\":\"u\",\"ý\":\"y\",\"þ\":\"th\",\"ÿ\":\"y\",\"Ā\":\"A\",\"ā\":\"a\",\"Ă\":\"A\",\"ă\":\"a\",\"Ą\":\"A\",\"ą\":\"a\",\"Ć\":\"C\",\"ć\":\"c\",\"Č\":\"C\",\"č\":\"c\",\"Ď\":\"D\",\"ď\":\"d\",\"Đ\":\"DJ\",\"đ\":\"dj\",\"Ē\":\"E\",\"ē\":\"e\",\"Ė\":\"E\",\"ė\":\"e\",\"Ę\":\"e\",\"ę\":\"e\",\"Ě\":\"E\",\"ě\":\"e\",\"Ğ\":\"G\",\"ğ\":\"g\",\"Ģ\":\"G\",\"ģ\":\"g\",\"Ĩ\":\"I\",\"ĩ\":\"i\",\"Ī\":\"i\",\"ī\":\"i\",\"Į\":\"I\",\"į\":\"i\",\"İ\":\"I\",\"ı\":\"i\",\"Ķ\":\"k\",\"ķ\":\"k\",\"Ļ\":\"L\",\"ļ\":\"l\",\"Ľ\":\"L\",\"ľ\":\"l\",\"Ł\":\"L\",\"ł\":\"l\",\"Ń\":\"N\",\"ń\":\"n\",\"Ņ\":\"N\",\"ņ\":\"n\",\"Ň\":\"N\",\"ň\":\"n\",\"Ō\":\"O\",\"ō\":\"o\",\"Ő\":\"O\",\"ő\":\"o\",\"Œ\":\"OE\",\"œ\":\"oe\",\"Ŕ\":\"R\",\"ŕ\":\"r\",\"Ř\":\"R\",\"ř\":\"r\",\"Ś\":\"S\",\"ś\":\"s\",\"Ş\":\"S\",\"ş\":\"s\",\"Š\":\"S\",\"š\":\"s\",\"Ţ\":\"T\",\"ţ\":\"t\",\"Ť\":\"T\",\"ť\":\"t\",\"Ũ\":\"U\",\"ũ\":\"u\",\"Ū\":\"u\",\"ū\":\"u\",\"Ů\":\"U\",\"ů\":\"u\",\"Ű\":\"U\",\"ű\":\"u\",\"Ų\":\"U\",\"ų\":\"u\",\"Ŵ\":\"W\",\"ŵ\":\"w\",\"Ŷ\":\"Y\",\"ŷ\":\"y\",\"Ÿ\":\"Y\",\"Ź\":\"Z\",\"ź\":\"z\",\"Ż\":\"Z\",\"ż\":\"z\",\"Ž\":\"Z\",\"ž\":\"z\",\"Ə\":\"E\",\"ƒ\":\"f\",\"Ơ\":\"O\",\"ơ\":\"o\",\"Ư\":\"U\",\"ư\":\"u\",\"ǈ\":\"LJ\",\"ǉ\":\"lj\",\"ǋ\":\"NJ\",\"ǌ\":\"nj\",\"Ș\":\"S\",\"ș\":\"s\",\"Ț\":\"T\",\"ț\":\"t\",\"ə\":\"e\",\"˚\":\"o\",\"Ά\":\"A\",\"Έ\":\"E\",\"Ή\":\"H\",\"Ί\":\"I\",\"Ό\":\"O\",\"Ύ\":\"Y\",\"Ώ\":\"W\",\"ΐ\":\"i\",\"Α\":\"A\",\"Β\":\"B\",\"Γ\":\"G\",\"Δ\":\"D\",\"Ε\":\"E\",\"Ζ\":\"Z\",\"Η\":\"H\",\"Θ\":\"8\",\"Ι\":\"I\",\"Κ\":\"K\",\"Λ\":\"L\",\"Μ\":\"M\",\"Ν\":\"N\",\"Ξ\":\"3\",\"Ο\":\"O\",\"Π\":\"P\",\"Ρ\":\"R\",\"Σ\":\"S\",\"Τ\":\"T\",\"Υ\":\"Y\",\"Φ\":\"F\",\"Χ\":\"X\",\"Ψ\":\"PS\",\"Ω\":\"W\",\"Ϊ\":\"I\",\"Ϋ\":\"Y\",\"ά\":\"a\",\"έ\":\"e\",\"ή\":\"h\",\"ί\":\"i\",\"ΰ\":\"y\",\"α\":\"a\",\"β\":\"b\",\"γ\":\"g\",\"δ\":\"d\",\"ε\":\"e\",\"ζ\":\"z\",\"η\":\"h\",\"θ\":\"8\",\"ι\":\"i\",\"κ\":\"k\",\"λ\":\"l\",\"μ\":\"m\",\"ν\":\"n\",\"ξ\":\"3\",\"ο\":\"o\",\"π\":\"p\",\"ρ\":\"r\",\"ς\":\"s\",\"σ\":\"s\",\"τ\":\"t\",\"υ\":\"y\",\"φ\":\"f\",\"χ\":\"x\",\"ψ\":\"ps\",\"ω\":\"w\",\"ϊ\":\"i\",\"ϋ\":\"y\",\"ό\":\"o\",\"ύ\":\"y\",\"ώ\":\"w\",\"Ё\":\"Yo\",\"Ђ\":\"DJ\",\"Є\":\"Ye\",\"І\":\"I\",\"Ї\":\"Yi\",\"Ј\":\"J\",\"Љ\":\"LJ\",\"Њ\":\"NJ\",\"Ћ\":\"C\",\"Џ\":\"DZ\",\"А\":\"A\",\"Б\":\"B\",\"В\":\"V\",\"Г\":\"G\",\"Д\":\"D\",\"Е\":\"E\",\"Ж\":\"Zh\",\"З\":\"Z\",\"И\":\"I\",\"Й\":\"J\",\"К\":\"K\",\"Л\":\"L\",\"М\":\"M\",\"Н\":\"N\",\"О\":\"O\",\"П\":\"P\",\"Р\":\"R\",\"С\":\"S\",\"Т\":\"T\",\"У\":\"U\",\"Ф\":\"F\",\"Х\":\"H\",\"Ц\":\"C\",\"Ч\":\"Ch\",\"Ш\":\"Sh\",\"Щ\":\"Sh\",\"Ъ\":\"U\",\"Ы\":\"Y\",\"Ь\":\"\",\"Э\":\"E\",\"Ю\":\"Yu\",\"Я\":\"Ya\",\"а\":\"a\",\"б\":\"b\",\"в\":\"v\",\"г\":\"g\",\"д\":\"d\",\"е\":\"e\",\"ж\":\"zh\",\"з\":\"z\",\"и\":\"i\",\"й\":\"j\",\"к\":\"k\",\"л\":\"l\",\"м\":\"m\",\"н\":\"n\",\"о\":\"o\",\"п\":\"p\",\"р\":\"r\",\"с\":\"s\",\"т\":\"t\",\"у\":\"u\",\"ф\":\"f\",\"х\":\"h\",\"ц\":\"c\",\"ч\":\"ch\",\"ш\":\"sh\",\"щ\":\"sh\",\"ъ\":\"u\",\"ы\":\"y\",\"ь\":\"\",\"э\":\"e\",\"ю\":\"yu\",\"я\":\"ya\",\"ё\":\"yo\",\"ђ\":\"dj\",\"є\":\"ye\",\"і\":\"i\",\"ї\":\"yi\",\"ј\":\"j\",\"љ\":\"lj\",\"њ\":\"nj\",\"ћ\":\"c\",\"ѝ\":\"u\",\"џ\":\"dz\",\"Ґ\":\"G\",\"ґ\":\"g\",\"Ғ\":\"GH\",\"ғ\":\"gh\",\"Қ\":\"KH\",\"қ\":\"kh\",\"Ң\":\"NG\",\"ң\":\"ng\",\"Ү\":\"UE\",\"ү\":\"ue\",\"Ұ\":\"U\",\"ұ\":\"u\",\"Һ\":\"H\",\"һ\":\"h\",\"Ә\":\"AE\",\"ә\":\"ae\",\"Ө\":\"OE\",\"ө\":\"oe\",\"Ա\":\"A\",\"Բ\":\"B\",\"Գ\":\"G\",\"Դ\":\"D\",\"Ե\":\"E\",\"Զ\":\"Z\",\"Է\":\"E'\",\"Ը\":\"Y'\",\"Թ\":\"T'\",\"Ժ\":\"JH\",\"Ի\":\"I\",\"Լ\":\"L\",\"Խ\":\"X\",\"Ծ\":\"C'\",\"Կ\":\"K\",\"Հ\":\"H\",\"Ձ\":\"D'\",\"Ղ\":\"GH\",\"Ճ\":\"TW\",\"Մ\":\"M\",\"Յ\":\"Y\",\"Ն\":\"N\",\"Շ\":\"SH\",\"Չ\":\"CH\",\"Պ\":\"P\",\"Ջ\":\"J\",\"Ռ\":\"R'\",\"Ս\":\"S\",\"Վ\":\"V\",\"Տ\":\"T\",\"Ր\":\"R\",\"Ց\":\"C\",\"Փ\":\"P'\",\"Ք\":\"Q'\",\"Օ\":\"O''\",\"Ֆ\":\"F\",\"և\":\"EV\",\"ء\":\"a\",\"آ\":\"aa\",\"أ\":\"a\",\"ؤ\":\"u\",\"إ\":\"i\",\"ئ\":\"e\",\"ا\":\"a\",\"ب\":\"b\",\"ة\":\"h\",\"ت\":\"t\",\"ث\":\"th\",\"ج\":\"j\",\"ح\":\"h\",\"خ\":\"kh\",\"د\":\"d\",\"ذ\":\"th\",\"ر\":\"r\",\"ز\":\"z\",\"س\":\"s\",\"ش\":\"sh\",\"ص\":\"s\",\"ض\":\"dh\",\"ط\":\"t\",\"ظ\":\"z\",\"ع\":\"a\",\"غ\":\"gh\",\"ف\":\"f\",\"ق\":\"q\",\"ك\":\"k\",\"ل\":\"l\",\"م\":\"m\",\"ن\":\"n\",\"ه\":\"h\",\"و\":\"w\",\"ى\":\"a\",\"ي\":\"y\",\"ً\":\"an\",\"ٌ\":\"on\",\"ٍ\":\"en\",\"َ\":\"a\",\"ُ\":\"u\",\"ِ\":\"e\",\"ْ\":\"\",\"٠\":\"0\",\"١\":\"1\",\"٢\":\"2\",\"٣\":\"3\",\"٤\":\"4\",\"٥\":\"5\",\"٦\":\"6\",\"٧\":\"7\",\"٨\":\"8\",\"٩\":\"9\",\"پ\":\"p\",\"چ\":\"ch\",\"ژ\":\"zh\",\"ک\":\"k\",\"گ\":\"g\",\"ی\":\"y\",\"۰\":\"0\",\"۱\":\"1\",\"۲\":\"2\",\"۳\":\"3\",\"۴\":\"4\",\"۵\":\"5\",\"۶\":\"6\",\"۷\":\"7\",\"۸\":\"8\",\"۹\":\"9\",\"฿\":\"baht\",\"ა\":\"a\",\"ბ\":\"b\",\"გ\":\"g\",\"დ\":\"d\",\"ე\":\"e\",\"ვ\":\"v\",\"ზ\":\"z\",\"თ\":\"t\",\"ი\":\"i\",\"კ\":\"k\",\"ლ\":\"l\",\"მ\":\"m\",\"ნ\":\"n\",\"ო\":\"o\",\"პ\":\"p\",\"ჟ\":\"zh\",\"რ\":\"r\",\"ს\":\"s\",\"ტ\":\"t\",\"უ\":\"u\",\"ფ\":\"f\",\"ქ\":\"k\",\"ღ\":\"gh\",\"ყ\":\"q\",\"შ\":\"sh\",\"ჩ\":\"ch\",\"ც\":\"ts\",\"ძ\":\"dz\",\"წ\":\"ts\",\"ჭ\":\"ch\",\"ხ\":\"kh\",\"ჯ\":\"j\",\"ჰ\":\"h\",\"Ṣ\":\"S\",\"ṣ\":\"s\",\"Ẁ\":\"W\",\"ẁ\":\"w\",\"Ẃ\":\"W\",\"ẃ\":\"w\",\"Ẅ\":\"W\",\"ẅ\":\"w\",\"ẞ\":\"SS\",\"Ạ\":\"A\",\"ạ\":\"a\",\"Ả\":\"A\",\"ả\":\"a\",\"Ấ\":\"A\",\"ấ\":\"a\",\"Ầ\":\"A\",\"ầ\":\"a\",\"Ẩ\":\"A\",\"ẩ\":\"a\",\"Ẫ\":\"A\",\"ẫ\":\"a\",\"Ậ\":\"A\",\"ậ\":\"a\",\"Ắ\":\"A\",\"ắ\":\"a\",\"Ằ\":\"A\",\"ằ\":\"a\",\"Ẳ\":\"A\",\"ẳ\":\"a\",\"Ẵ\":\"A\",\"ẵ\":\"a\",\"Ặ\":\"A\",\"ặ\":\"a\",\"Ẹ\":\"E\",\"ẹ\":\"e\",\"Ẻ\":\"E\",\"ẻ\":\"e\",\"Ẽ\":\"E\",\"ẽ\":\"e\",\"Ế\":\"E\",\"ế\":\"e\",\"Ề\":\"E\",\"ề\":\"e\",\"Ể\":\"E\",\"ể\":\"e\",\"Ễ\":\"E\",\"ễ\":\"e\",\"Ệ\":\"E\",\"ệ\":\"e\",\"Ỉ\":\"I\",\"ỉ\":\"i\",\"Ị\":\"I\",\"ị\":\"i\",\"Ọ\":\"O\",\"ọ\":\"o\",\"Ỏ\":\"O\",\"ỏ\":\"o\",\"Ố\":\"O\",\"ố\":\"o\",\"Ồ\":\"O\",\"ồ\":\"o\",\"Ổ\":\"O\",\"ổ\":\"o\",\"Ỗ\":\"O\",\"ỗ\":\"o\",\"Ộ\":\"O\",\"ộ\":\"o\",\"Ớ\":\"O\",\"ớ\":\"o\",\"Ờ\":\"O\",\"ờ\":\"o\",\"Ở\":\"O\",\"ở\":\"o\",\"Ỡ\":\"O\",\"ỡ\":\"o\",\"Ợ\":\"O\",\"ợ\":\"o\",\"Ụ\":\"U\",\"ụ\":\"u\",\"Ủ\":\"U\",\"ủ\":\"u\",\"Ứ\":\"U\",\"ứ\":\"u\",\"Ừ\":\"U\",\"ừ\":\"u\",\"Ử\":\"U\",\"ử\":\"u\",\"Ữ\":\"U\",\"ữ\":\"u\",\"Ự\":\"U\",\"ự\":\"u\",\"Ỳ\":\"Y\",\"ỳ\":\"y\",\"Ỵ\":\"Y\",\"ỵ\":\"y\",\"Ỷ\":\"Y\",\"ỷ\":\"y\",\"Ỹ\":\"Y\",\"ỹ\":\"y\",\"–\":\"-\",\"‘\":\"'\",\"’\":\"'\",\"“\":\"\\\"\",\"”\":\"\\\"\",\"„\":\"\\\"\",\"†\":\"+\",\"•\":\"*\",\"…\":\"...\",\"₠\":\"ecu\",\"₢\":\"cruzeiro\",\"₣\":\"french franc\",\"₤\":\"lira\",\"₥\":\"mill\",\"₦\":\"naira\",\"₧\":\"peseta\",\"₨\":\"rupee\",\"₩\":\"won\",\"₪\":\"new shequel\",\"₫\":\"dong\",\"€\":\"euro\",\"₭\":\"kip\",\"₮\":\"tugrik\",\"₯\":\"drachma\",\"₰\":\"penny\",\"₱\":\"peso\",\"₲\":\"guarani\",\"₳\":\"austral\",\"₴\":\"hryvnia\",\"₵\":\"cedi\",\"₸\":\"kazakhstani tenge\",\"₹\":\"indian rupee\",\"₺\":\"turkish lira\",\"₽\":\"russian ruble\",\"₿\":\"bitcoin\",\"℠\":\"sm\",\"™\":\"tm\",\"∂\":\"d\",\"∆\":\"delta\",\"∑\":\"sum\",\"∞\":\"infinity\",\"♥\":\"love\",\"元\":\"yuan\",\"円\":\"yen\",\"﷼\":\"rial\",\"ﻵ\":\"laa\",\"ﻷ\":\"laa\",\"ﻹ\":\"lai\",\"ﻻ\":\"la\"}");
		var locales = JSON.parse("{\"bg\":{\"Й\":\"Y\",\"Ц\":\"Ts\",\"Щ\":\"Sht\",\"Ъ\":\"A\",\"Ь\":\"Y\",\"й\":\"y\",\"ц\":\"ts\",\"щ\":\"sht\",\"ъ\":\"a\",\"ь\":\"y\"},\"de\":{\"Ä\":\"AE\",\"ä\":\"ae\",\"Ö\":\"OE\",\"ö\":\"oe\",\"Ü\":\"UE\",\"ü\":\"ue\",\"ß\":\"ss\",\"%\":\"prozent\",\"&\":\"und\",\"|\":\"oder\",\"∑\":\"summe\",\"∞\":\"unendlich\",\"♥\":\"liebe\"},\"es\":{\"%\":\"por ciento\",\"&\":\"y\",\"<\":\"menor que\",\">\":\"mayor que\",\"|\":\"o\",\"¢\":\"centavos\",\"£\":\"libras\",\"¤\":\"moneda\",\"₣\":\"francos\",\"∑\":\"suma\",\"∞\":\"infinito\",\"♥\":\"amor\"},\"fr\":{\"%\":\"pourcent\",\"&\":\"et\",\"<\":\"plus petit\",\">\":\"plus grand\",\"|\":\"ou\",\"¢\":\"centime\",\"£\":\"livre\",\"¤\":\"devise\",\"₣\":\"franc\",\"∑\":\"somme\",\"∞\":\"infini\",\"♥\":\"amour\"},\"pt\":{\"%\":\"porcento\",\"&\":\"e\",\"<\":\"menor\",\">\":\"maior\",\"|\":\"ou\",\"¢\":\"centavo\",\"∑\":\"soma\",\"£\":\"libra\",\"∞\":\"infinito\",\"♥\":\"amor\"},\"uk\":{\"И\":\"Y\",\"и\":\"y\",\"Й\":\"Y\",\"й\":\"y\",\"Ц\":\"Ts\",\"ц\":\"ts\",\"Х\":\"Kh\",\"х\":\"kh\",\"Щ\":\"Shch\",\"щ\":\"shch\",\"Г\":\"H\",\"г\":\"h\"},\"vi\":{\"Đ\":\"D\",\"đ\":\"d\"},\"da\":{\"Ø\":\"OE\",\"ø\":\"oe\",\"Å\":\"AA\",\"å\":\"aa\",\"%\":\"procent\",\"&\":\"og\",\"|\":\"eller\",\"$\":\"dollar\",\"<\":\"mindre end\",\">\":\"større end\"},\"nb\":{\"&\":\"og\",\"Å\":\"AA\",\"Æ\":\"AE\",\"Ø\":\"OE\",\"å\":\"aa\",\"æ\":\"ae\",\"ø\":\"oe\"},\"it\":{\"&\":\"e\"},\"nl\":{\"&\":\"en\"},\"sv\":{\"&\":\"och\",\"Å\":\"AA\",\"Ä\":\"AE\",\"Ö\":\"OE\",\"å\":\"aa\",\"ä\":\"ae\",\"ö\":\"oe\"}}");
		function replace(string, options) {
			if (typeof string !== "string") throw new Error("slugify: string argument expected");
			options = typeof options === "string" ? { replacement: options } : options || {};
			var locale = locales[options.locale] || {};
			var replacement = options.replacement === void 0 ? "-" : options.replacement;
			var trim = options.trim === void 0 ? true : options.trim;
			var slug = string.normalize().split("").reduce(function(result, ch) {
				var appendChar = locale[ch];
				if (appendChar === void 0) appendChar = charMap[ch];
				if (appendChar === void 0) appendChar = ch;
				if (appendChar === replacement) appendChar = " ";
				return result + appendChar.replace(options.remove || /[^\w\s$*_+~.()'"!\-:@]+/g, "");
			}, "");
			if (options.strict) slug = slug.replace(/[^A-Za-z0-9\s]/g, "");
			if (trim) slug = slug.trim();
			slug = slug.replace(/\s+/g, replacement);
			if (options.lower) slug = slug.toLowerCase();
			return slug;
		}
		replace.extend = function(customMap) {
			Object.assign(charMap, customMap);
		};
		return replace;
	});
} });

//#endregion
//#region src/cli/handlers/project.handler.ts
var import_slugify$1 = __toESM(require_slugify(), 1);
const PROJECTS_DIR$1 = ".festinalente/projects";
const TASKS_DIR$4 = ".festinalente/tasks";
const MAX_SLUG_LENGTH$1 = 50;
/**
* Create a project handler with injected dependencies.
*
* @param deps - The dependencies for the project handler.
* @returns A ProjectHandler instance.
*/
function createProjectHandler(deps) {
	const { fs: fs$3, xmlParser } = deps;
	/**
	* Status-to-progress-key mapping for counting tasks by status.
	*/
	const statusKeyMap = {
		"backlog": "backlog",
		"scoped": "scoped",
		"planned": "planned",
		"in-progress": "inProgress",
		"finalize": "finalize",
		"awaiting-completion": "awaitingCompletion",
		"done": "done"
	};
	/**
	* Resolve a project folder by ID (exact match or P-prefix-only match).
	*
	* @param id - The project ID or prefix to resolve.
	* @returns The matching folder name and project.xml path, or null.
	*/
	function resolveProjectFolder(id) {
		if (!fs$3.exists(PROJECTS_DIR$1)) return null;
		const dirsResult = fs$3.listDirectories(PROJECTS_DIR$1);
		if (!dirsResult.ok) return null;
		const folders = dirsResult.value;
		const exact = folders.find((f) => f === id);
		if (exact) {
			const projectPath = fs$3.joinPath(PROJECTS_DIR$1, exact, "project.xml").replace(/\\/g, "/");
			if (fs$3.exists(projectPath)) return {
				folder: exact,
				projectPath
			};
		}
		const prefixMatch = folders.find((f) => f.startsWith(id + "-") || f === id);
		if (prefixMatch) {
			const projectPath = fs$3.joinPath(PROJECTS_DIR$1, prefixMatch, "project.xml").replace(/\\/g, "/");
			if (fs$3.exists(projectPath)) return {
				folder: prefixMatch,
				projectPath
			};
		}
		return null;
	}
	/**
	* Scan all tasks for those matching a given project ID.
	*
	* @param projectId - The project ID to match against task project-id attributes.
	* @returns Array of project task info objects.
	*/
	function scanTasksForProject(projectId) {
		if (!fs$3.exists(TASKS_DIR$4)) return [];
		const dirsResult = fs$3.listDirectories(TASKS_DIR$4);
		if (!dirsResult.ok) return [];
		return dirsResult.value.map((folder) => {
			const taskPath = fs$3.joinPath(TASKS_DIR$4, folder, "task.xml").replace(/\\/g, "/");
			if (!fs$3.exists(taskPath)) return null;
			const readResult = fs$3.readFile(taskPath);
			if (!readResult.ok) return null;
			const parsed = xmlParser.parseTaskXml(readResult.value);
			if (parsed.projectId !== projectId) return null;
			return {
				id: folder,
				title: parsed.title,
				status: parsed.status,
				priority: parsed.priority,
				requirements: parsed.projectRequirements ?? []
			};
		}).filter((t) => t !== null);
	}
	/**
	* Get the next available project ID.
	*
	* @param args - Command arguments with --title flag.
	* @returns The next project ID result.
	*/
	function nextProjectId(args) {
		const parsed = parseArgs(args);
		const title = getStringFlag(parsed.flags, "title");
		if (!title) return error("Usage: next-project-id --title=\"Project title\"");
		const slug = (0, import_slugify$1.default)(title, {
			lower: true,
			strict: true
		}).slice(0, MAX_SLUG_LENGTH$1);
		const padding = 3;
		if (!fs$3.exists(PROJECTS_DIR$1)) return success({
			nextId: `P${"1".padStart(padding, "0")}-${slug}`,
			currentHighest: 0,
			slug
		});
		const dirsResult = fs$3.listDirectories(PROJECTS_DIR$1);
		if (!dirsResult.ok || dirsResult.value.length === 0) return success({
			nextId: `P${"1".padStart(padding, "0")}-${slug}`,
			currentHighest: 0,
			slug
		});
		const highest = dirsResult.value.reduce((max, folderName) => {
			const match = folderName.match(/^P(\d+)/);
			if (!match) return max;
			const num = parseInt(match[1], 10);
			return isNaN(num) ? max : Math.max(max, num);
		}, 0);
		const paddedNumber = (highest + 1).toString().padStart(padding, "0");
		return success({
			nextId: `P${paddedNumber}-${slug}`,
			currentHighest: highest,
			slug
		});
	}
	/**
	* Find a project by ID.
	*
	* @param args - Command arguments with project ID.
	* @returns The project info result.
	*/
	function findProject(args) {
		if (args.length === 0) return error("Usage: find-project <id>");
		const id = args[0];
		if (!fs$3.exists(PROJECTS_DIR$1)) return error(`${PROJECTS_DIR$1}/ directory not found.`);
		const resolved = resolveProjectFolder(id);
		if (!resolved) return error(`Project ${id} not found in ${PROJECTS_DIR$1}/`);
		const readResult = fs$3.readFile(resolved.projectPath);
		if (!readResult.ok) return error(`Failed to read project file: ${readResult.error.message}`);
		const parsed = xmlParser.parseProjectXml(readResult.value);
		return success({
			id: resolved.folder,
			path: resolved.projectPath,
			title: parsed.title,
			status: parsed.status,
			taskCount: parsed.tasks.length
		});
	}
	/**
	* List all projects with optional status filter.
	*
	* @param args - Command arguments with optional --status flag.
	* @returns The list projects result.
	*/
	function listProjects(args) {
		const parsed = parseArgs(args);
		const statusFilter = getStringFlag(parsed.flags, "status");
		if (!fs$3.exists(PROJECTS_DIR$1)) return success({
			count: 0,
			projects: []
		});
		const dirsResult = fs$3.listDirectories(PROJECTS_DIR$1);
		if (!dirsResult.ok) return error(`Failed to read projects directory: ${dirsResult.error.message}`);
		const projects = dirsResult.value.sort().map((folder) => {
			const projectPath = fs$3.joinPath(PROJECTS_DIR$1, folder, "project.xml").replace(/\\/g, "/");
			if (!fs$3.exists(projectPath)) return null;
			const readResult = fs$3.readFile(projectPath);
			if (!readResult.ok) return null;
			const parsedProject = xmlParser.parseProjectXml(readResult.value);
			if (statusFilter && parsedProject.status !== statusFilter) return null;
			return {
				id: folder,
				path: projectPath,
				title: parsedProject.title,
				status: parsedProject.status,
				taskCount: parsedProject.tasks.length
			};
		}).filter((p) => p !== null);
		return success({
			count: projects.length,
			projects
		});
	}
	/**
	* Get all tasks belonging to a project.
	*
	* @param args - Command arguments with project ID.
	* @returns The project tasks result.
	*/
	function getProjectTasks(args) {
		if (args.length === 0) return error("Usage: get-project-tasks <project-id>");
		const projectId = args[0];
		const resolved = resolveProjectFolder(projectId);
		if (!resolved) return error(`Project ${projectId} not found in ${PROJECTS_DIR$1}/`);
		const tasks = scanTasksForProject(resolved.folder);
		return success({
			count: tasks.length,
			tasks
		});
	}
	/**
	* Get progress counts for a project.
	*
	* @param args - Command arguments with project ID.
	* @returns The project progress result with counts by status.
	*/
	function getProjectProgress(args) {
		if (args.length === 0) return error("Usage: get-project-progress <project-id>");
		const projectId = args[0];
		const resolved = resolveProjectFolder(projectId);
		if (!resolved) return error(`Project ${projectId} not found in ${PROJECTS_DIR$1}/`);
		const tasks = scanTasksForProject(resolved.folder);
		const counts = {
			total: tasks.length,
			backlog: 0,
			scoped: 0,
			planned: 0,
			inProgress: 0,
			finalize: 0,
			awaitingCompletion: 0,
			done: 0
		};
		for (const task of tasks) {
			const key = statusKeyMap[task.status];
			if (key && key !== "total") counts[key]++;
		}
		return success(counts);
	}
	/**
	* Get sibling tasks for a given task within its project.
	*
	* @param args - Command arguments with task ID.
	* @returns The project siblings result.
	*/
	function getProjectSiblings(args) {
		if (args.length === 0) return error("Usage: get-project-siblings <task-id>");
		const taskId = args[0];
		if (!fs$3.exists(TASKS_DIR$4)) return error(`${TASKS_DIR$4}/ directory not found.`);
		const dirsResult = fs$3.listDirectories(TASKS_DIR$4);
		if (!dirsResult.ok) return error(`Failed to read tasks directory: ${dirsResult.error.message}`);
		const taskFolder = dirsResult.value.find((f) => f === taskId || f.startsWith(taskId + "-") || f.match(/^(\d+)/) && f.match(/^(\d+)/)?.[1] === taskId);
		if (!taskFolder) return error(`Task ${taskId} not found in ${TASKS_DIR$4}/`);
		const taskPath = fs$3.joinPath(TASKS_DIR$4, taskFolder, "task.xml").replace(/\\/g, "/");
		if (!fs$3.exists(taskPath)) return error(`Task file not found at ${taskPath}`);
		const readResult = fs$3.readFile(taskPath);
		if (!readResult.ok) return error(`Failed to read task file: ${readResult.error.message}`);
		const parsedTask = xmlParser.parseTaskXml(readResult.value);
		if (!parsedTask.projectId) return error("Task is not part of a project");
		const resolved = resolveProjectFolder(parsedTask.projectId);
		if (!resolved) return error(`Project ${parsedTask.projectId} not found in ${PROJECTS_DIR$1}/`);
		const projectReadResult = fs$3.readFile(resolved.projectPath);
		if (!projectReadResult.ok) return error(`Failed to read project file: ${projectReadResult.error.message}`);
		const parsedProject = xmlParser.parseProjectXml(projectReadResult.value);
		const allTasks = scanTasksForProject(resolved.folder);
		const siblings = allTasks.filter((t) => t.id !== taskFolder).map((t) => {
			const siblingPath = fs$3.joinPath(TASKS_DIR$4, t.id, "task.xml").replace(/\\/g, "/");
			const siblingRead = fs$3.readFile(siblingPath);
			const description = siblingRead.ok ? xmlParser.parseTaskXml(siblingRead.value).description : "";
			return {
				id: t.id,
				title: t.title,
				status: t.status,
				description
			};
		});
		return success({
			projectId: resolved.folder,
			projectTitle: parsedProject.title,
			siblings
		});
	}
	/**
	* Get all command definitions for this handler.
	*
	* @returns Array of CLI command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("next-project-id", "Get the next available project ID", "next-project-id --title=\"Project title\"", nextProjectId),
			defineCommand("find-project", "Find a project by ID", "find-project <id>", findProject),
			defineCommand("list-projects", "List all projects with optional filtering", "list-projects [--status=X]", listProjects),
			defineCommand("get-project-tasks", "Get all tasks belonging to a project", "get-project-tasks <project-id>", getProjectTasks),
			defineCommand("get-project-progress", "Get progress counts for a project", "get-project-progress <project-id>", getProjectProgress),
			defineCommand("get-project-siblings", "Get sibling tasks for a task within its project", "get-project-siblings <task-id>", getProjectSiblings)
		];
	}
	return { getCommands };
}

//#endregion
//#region src/cli/handlers/docs.handler.ts
const PRODUCT_DIR$3 = ".festinalente/product";
const ENGINEERING_DIR$3 = ".festinalente/engineering";
/**
* Create a docs handler.
*
* @param deps - The dependencies.
* @returns A DocsHandler instance.
*/
function createDocsHandler(deps) {
	const { fs: fs$3, yamlParser } = deps;
	/**
	* Derive ID and domain from product file path.
	*/
	function deriveProductIdAndDomain(filePath) {
		const relativePath = fs$3.relativePath(PRODUCT_DIR$3, filePath).replace(/\\/g, "/");
		const withoutExt = relativePath.replace(/\.md$/, "");
		const parts = withoutExt.split("/");
		if (parts.length === 1) return {
			id: parts[0],
			domain: null
		};
		return {
			id: withoutExt,
			domain: parts[0]
		};
	}
	/**
	* Derive ID and system from engineering file path.
	*/
	function deriveEngineeringIdAndSystem(filePath) {
		const relativePath = fs$3.relativePath(ENGINEERING_DIR$3, filePath).replace(/\\/g, "/");
		const withoutExt = relativePath.replace(/\.md$/, "");
		const parts = withoutExt.split("/");
		if (parts.length === 1) return {
			id: parts[0],
			system: null
		};
		if (parts[0] === "systems") {
			if (parts.length === 3 && parts[2] === "_index") return {
				id: `${parts[0]}/${parts[1]}`,
				system: null
			};
			else if (parts.length === 3) return {
				id: withoutExt,
				system: parts[1]
			};
			else if (parts.length === 2) return {
				id: withoutExt,
				system: null
			};
		}
		return {
			id: withoutExt,
			system: null
		};
	}
	/**
	* Convert engineering doc ID to file path.
	*/
	function engineeringIdToPath(id) {
		if (id === "overview") return fs$3.joinPath(ENGINEERING_DIR$3, "overview.md");
		const parts = id.split("/");
		if (parts[0] === "systems" && parts.length === 2) return fs$3.joinPath(ENGINEERING_DIR$3, parts[0], parts[1], "_index.md");
		return fs$3.joinPath(ENGINEERING_DIR$3, `${id}.md`);
	}
	/**
	* List product docs command.
	*/
	function listProduct(args) {
		const parsed = parseArgs(args);
		const typeFilter = getStringFlag(parsed.flags, "type");
		const domainFilter = getStringFlag(parsed.flags, "domain");
		if (!fs$3.exists(PRODUCT_DIR$3)) return error(`${PRODUCT_DIR$3}/ directory not found. Run npx festinalente first.`);
		const scanResult = fs$3.scanRecursive(PRODUCT_DIR$3, ".md");
		if (!scanResult.ok) return error(`Failed to scan product directory: ${scanResult.error.message}`);
		const files = [...scanResult.value].sort();
		const docs = [];
		for (const filePath of files) {
			const normalizedPath = filePath.replace(/\\/g, "/");
			const readResult = fs$3.readFile(filePath);
			if (!readResult.ok) continue;
			const { data: frontmatter } = yamlParser.parseFrontmatter(readResult.value);
			const { id, domain } = deriveProductIdAndDomain(filePath);
			const doc = {
				id: frontmatter.id || id,
				title: frontmatter.title || "",
				type: frontmatter.type || "feature",
				summary: frontmatter.summary || "",
				keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
				domain,
				path: normalizedPath
			};
			if (typeFilter && doc.type !== typeFilter) continue;
			if (domainFilter && doc.domain !== domainFilter) continue;
			docs.push(doc);
		}
		return success({
			count: docs.length,
			docs
		});
	}
	/**
	* List engineering docs command.
	*/
	function listEngineering(args) {
		const parsed = parseArgs(args);
		const typeFilter = getStringFlag(parsed.flags, "type");
		const systemFilter = getStringFlag(parsed.flags, "system");
		if (!fs$3.exists(ENGINEERING_DIR$3)) return error(`${ENGINEERING_DIR$3}/ directory not found. Run npx festinalente first.`);
		const scanResult = fs$3.scanRecursive(ENGINEERING_DIR$3, ".md");
		if (!scanResult.ok) return error(`Failed to scan engineering directory: ${scanResult.error.message}`);
		const files = [...scanResult.value].sort();
		const docs = [];
		for (const filePath of files) {
			const normalizedPath = filePath.replace(/\\/g, "/");
			const readResult = fs$3.readFile(filePath);
			if (!readResult.ok) continue;
			const { data: frontmatter } = yamlParser.parseFrontmatter(readResult.value);
			const { id, system } = deriveEngineeringIdAndSystem(filePath);
			const doc = {
				id: frontmatter.id || id,
				title: frontmatter.title || "",
				type: frontmatter.type || "pattern",
				summary: frontmatter.summary || "",
				keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
				system,
				paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
				filePath: normalizedPath
			};
			if (typeFilter && doc.type !== typeFilter) continue;
			if (systemFilter && doc.system !== systemFilter) continue;
			docs.push(doc);
		}
		return success({
			count: docs.length,
			docs
		});
	}
	/**
	* Check product docs command.
	*/
	function checkProduct(args) {
		const parsed = parseArgs(args);
		const ids = parsed.positional;
		if (ids.length === 0) return error("Usage: check-product id1 id2 ... (e.g., auth/login auth/mfa)");
		const results = [];
		const existing = [];
		const missing = [];
		for (const id of ids) {
			const docPath = fs$3.joinPath(PRODUCT_DIR$3, `${id}.md`).replace(/\\/g, "/");
			const exists = fs$3.exists(docPath);
			results.push({
				id,
				exists,
				path: docPath
			});
			if (exists) existing.push(id);
			else missing.push(id);
		}
		return success({
			results,
			summary: {
				existing,
				missing
			}
		});
	}
	/**
	* Check engineering docs command.
	*/
	function checkEngineering(args) {
		const parsed = parseArgs(args);
		const ids = parsed.positional;
		if (ids.length === 0) return error("Usage: check-engineering id1 id2 ... (e.g., systems/auth patterns/middleware)");
		const results = [];
		const existing = [];
		const missing = [];
		for (const id of ids) {
			const docPath = engineeringIdToPath(id).replace(/\\/g, "/");
			const exists = fs$3.exists(docPath);
			results.push({
				id,
				exists,
				path: docPath
			});
			if (exists) existing.push(id);
			else missing.push(id);
		}
		return success({
			results,
			summary: {
				existing,
				missing
			}
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("list-product", "List all product docs with optional filtering", "list-product [--type=X] [--domain=X]", listProduct),
			defineCommand("list-engineering", "List all engineering docs with optional filtering", "list-engineering [--type=X] [--system=X]", listEngineering),
			defineCommand("check-product", "Check if product docs exist by ID", "check-product id1 id2 ...", checkProduct),
			defineCommand("check-engineering", "Check if engineering docs exist by ID", "check-engineering id1 id2 ...", checkEngineering)
		];
	}
	return {
		listProduct,
		listEngineering,
		checkProduct,
		checkEngineering,
		getCommands
	};
}

//#endregion
//#region src/cli/capabilities/file-system.capability.ts
/**
* Create a success result.
*
* @param value - The success value.
* @returns A success result.
*/
function ok(value) {
	return {
		ok: true,
		value
	};
}
/**
* Create an error result.
*
* @param error - The error.
* @returns An error result.
*/
function err(error$1) {
	return {
		ok: false,
		error: error$1
	};
}
/**
* Create a file system capability.
*
* @returns A FileSystemCapability instance.
*/
function createFileSystemCapability() {
	function readFile(filePath) {
		try {
			const content = fs.default.readFileSync(filePath, "utf8");
			return ok(content);
		} catch (e) {
			return err(e instanceof Error ? e : new Error(String(e)));
		}
	}
	function writeFile(filePath, content) {
		try {
			fs.default.writeFileSync(filePath, content, "utf8");
			return ok(void 0);
		} catch (e) {
			return err(e instanceof Error ? e : new Error(String(e)));
		}
	}
	function exists(filePath) {
		return fs.default.existsSync(filePath);
	}
	function isDirectory(filePath) {
		try {
			return fs.default.statSync(filePath).isDirectory();
		} catch {
			return false;
		}
	}
	function readDir(dirPath) {
		try {
			const entries = fs.default.readdirSync(dirPath, { withFileTypes: true });
			return ok(entries.map((entry) => ({
				name: entry.name,
				isDirectory: entry.isDirectory(),
				isFile: entry.isFile()
			})));
		} catch (e) {
			return err(e instanceof Error ? e : new Error(String(e)));
		}
	}
	function listDirectories(dirPath) {
		const result = readDir(dirPath);
		if (!result.ok) return result;
		return ok(result.value.filter((e) => e.isDirectory).map((e) => e.name));
	}
	function joinPath(...parts) {
		return path.default.join(...parts);
	}
	function relativePath(from, to) {
		return path.default.relative(from, to);
	}
	function dirname(filePath) {
		return path.default.dirname(filePath);
	}
	function basename(filePath, ext) {
		return path.default.basename(filePath, ext);
	}
	function deleteFile(filePath) {
		try {
			fs.default.unlinkSync(filePath);
			return ok(void 0);
		} catch (e) {
			return err(e instanceof Error ? e : new Error(String(e)));
		}
	}
	function scanRecursive(dirPath, extension) {
		try {
			if (!fs.default.existsSync(dirPath)) return ok([]);
			const files = [];
			function scan(dir) {
				const entries = fs.default.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					const fullPath = path.default.join(dir, entry.name);
					if (entry.isDirectory()) scan(fullPath);
					else if (entry.isFile() && entry.name.endsWith(extension)) files.push(fullPath);
				}
			}
			scan(dirPath);
			return ok(files);
		} catch (e) {
			return err(e instanceof Error ? e : new Error(String(e)));
		}
	}
	return {
		readFile,
		writeFile,
		exists,
		isDirectory,
		readDir,
		listDirectories,
		joinPath,
		relativePath,
		dirname,
		basename,
		deleteFile,
		scanRecursive
	};
}

//#endregion
//#region src/cli/handlers/query.handler.ts
const TASKS_DIR$3 = ".festinalente/tasks";
const PRODUCT_DIR$2 = ".festinalente/product";
const ENGINEERING_DIR$2 = ".festinalente/engineering";
/**
* Create a query handler.
*
* @param deps - The dependencies.
* @returns A QueryHandler instance.
*/
function createQueryHandler(deps) {
	const { fs: fs$3, yamlParser, xmlParser } = deps;
	/**
	* Find task file by ID.
	*/
	function findTaskFile(taskId) {
		const taskDir = fs$3.joinPath(TASKS_DIR$3, taskId);
		const taskFile = fs$3.joinPath(taskDir, "task.xml");
		if (fs$3.exists(taskFile)) return taskFile;
		if (fs$3.exists(TASKS_DIR$3)) {
			const dirsResult = fs$3.listDirectories(TASKS_DIR$3);
			if (dirsResult.ok) {
				for (const entry of dirsResult.value) if (entry.endsWith(taskId) || entry === taskId) {
					const possibleFile = fs$3.joinPath(TASKS_DIR$3, entry, "task.xml");
					if (fs$3.exists(possibleFile)) return possibleFile;
				}
			}
		}
		return null;
	}
	/**
	* Resolve doc path from ID.
	*/
	function resolveDocPath(id, baseDir) {
		let docPath = fs$3.joinPath(baseDir, `${id}.md`);
		if (fs$3.exists(docPath)) return docPath;
		if (baseDir === ENGINEERING_DIR$2 && id.startsWith("systems/")) {
			docPath = fs$3.joinPath(baseDir, id, "_index.md");
			if (fs$3.exists(docPath)) return docPath;
		}
		docPath = fs$3.joinPath(baseDir, id);
		if (!docPath.endsWith(".md")) docPath += ".md";
		return docPath;
	}
	/**
	* Read doc from path.
	*/
	function readDoc(docPath, docType) {
		if (!fs$3.exists(docPath)) return null;
		const readResult = fs$3.readFile(docPath);
		if (!readResult.ok) return null;
		try {
			const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
			return {
				id: frontmatter.id || fs$3.basename(docPath, ".md"),
				type: docType,
				relevanceScore: 1,
				content: body,
				tldr: frontmatter.tldr || "",
				summary: frontmatter.summary || "",
				boundary: frontmatter.boundary || ""
			};
		} catch {
			return null;
		}
	}
	/**
	* Get tiered content based on tier level.
	*/
	function getTieredContent(doc, tier) {
		switch (tier) {
			case "minimal": return doc.tldr || doc.summary?.split(".")[0] || "";
			case "standard": {
				const parts = [];
				if (doc.tldr) parts.push(`**TL;DR:** ${doc.tldr}`);
				if (doc.summary) parts.push(`**Summary:** ${doc.summary}`);
				if (doc.boundary) parts.push(`**Boundaries:** ${doc.boundary}`);
				return parts.join("\n\n");
			}
			case "full":
			default: return doc.content;
		}
	}
	/**
	* Estimate tokens from text.
	*/
	function estimateTokens(text) {
		return Math.ceil(text.length / 4);
	}
	/**
	* Select context command.
	*/
	function selectContext(args) {
		const parsed = parseArgs(args);
		const taskId = parsed.positional[0];
		const tier = getStringFlag(parsed.flags, "tier") || "standard";
		const maxDocs = getNumberFlag(parsed.flags, "max") ?? 5;
		if (!taskId) return error("Usage: select-context <task-id> [--tier=minimal|standard|full] [--max=5]");
		const taskFile = findTaskFile(taskId);
		if (!taskFile) return error(`Task ${taskId} not found`);
		const readResult = fs$3.readFile(taskFile);
		if (!readResult.ok) return error(`Failed to read task file: ${readResult.error.message}`);
		const task = xmlParser.parseTaskXml(readResult.value);
		const docs = [];
		const seenIds = new Set();
		for (const id of task.affects) {
			if (seenIds.has(id)) continue;
			seenIds.add(id);
			const docPath = resolveDocPath(id, PRODUCT_DIR$2);
			const doc = readDoc(docPath, "product");
			if (doc) docs.push({
				...doc,
				relevanceScore: 1
			});
		}
		for (const id of task.engineering) {
			if (seenIds.has(id)) continue;
			seenIds.add(id);
			const docPath = resolveDocPath(id, ENGINEERING_DIR$2);
			const doc = readDoc(docPath, "engineering");
			if (doc) docs.push({
				...doc,
				relevanceScore: 1
			});
		}
		docs.sort((a, b) => b.relevanceScore - a.relevanceScore);
		const selectedDocs = docs.slice(0, maxDocs);
		const tieredDocs = selectedDocs.map((doc) => ({
			...doc,
			content: getTieredContent(doc, tier)
		}));
		const totalTokens = tieredDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0);
		return success({
			taskId,
			tier,
			docs: tieredDocs,
			totalTokensEstimate: totalTokens
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [defineCommand("select-context", "Smart context selection for task implementation", "select-context <task-id> [--tier=minimal|standard|full] [--max=5]", selectContext)];
	}
	return {
		selectContext,
		getCommands
	};
}

//#endregion
//#region src/cli/handlers/quick.handler.ts
const QUICK_DIR$1 = ".festinalente/quick";
/**
* Create a quick handler.
*
* @param deps - The dependencies.
* @returns A QuickHandler instance.
*/
function createQuickHandler(deps) {
	const { fs: fs$3, xmlParser } = deps;
	/**
	* Find quick command.
	*/
	function findQuick(args) {
		if (args.length === 0) return error("Usage: find-quick <id>");
		const id = args[0];
		if (!fs$3.exists(QUICK_DIR$1)) return error(`${QUICK_DIR$1}/ directory not found. No quick tasks exist yet.`);
		const quickPath = fs$3.joinPath(QUICK_DIR$1, id, "quick.xml").replace(/\\/g, "/");
		if (!fs$3.exists(quickPath)) return error(`Quick task ${id} not found in ${QUICK_DIR$1}/${id}/`);
		const readResult = fs$3.readFile(quickPath);
		if (!readResult.ok) return error(`Failed to read quick file: ${readResult.error.message}`);
		const parsed = xmlParser.parseQuickXml(readResult.value);
		return success({
			id,
			filename: "quick.xml",
			path: quickPath,
			title: parsed.title,
			created: parsed.created,
			updated: parsed.updated
		});
	}
	/**
	* Next quick ID command.
	*/
	function nextQuickId(_args) {
		const padding = 3;
		if (!fs$3.exists(QUICK_DIR$1)) return success({
			nextId: "0".padStart(padding, "0"),
			currentHighest: null,
			padding
		});
		const dirsResult = fs$3.listDirectories(QUICK_DIR$1);
		if (!dirsResult.ok || dirsResult.value.length === 0) return success({
			nextId: "0".padStart(padding, "0"),
			currentHighest: null,
			padding
		});
		let highest = -1;
		for (const folderName of dirsResult.value) {
			const id = parseInt(folderName, 10);
			if (!isNaN(id) && id > highest) highest = id;
		}
		const nextId = (highest + 1).toString().padStart(padding, "0");
		const currentHighest = highest >= 0 ? highest.toString().padStart(padding, "0") : null;
		return success({
			nextId,
			currentHighest,
			padding
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [defineCommand("find-quick", "Find a quick task by ID", "find-quick <id>", findQuick), defineCommand("next-quick-id", "Get the next available quick task ID", "next-quick-id", nextQuickId)];
	}
	return {
		findQuick,
		nextQuickId,
		getCommands
	};
}

//#endregion
//#region src/cli/computers/graph.computer.ts
/**
* Create a graph computer for document relationship traversal.
*
* @returns A GraphComputer instance.
*/
function createGraphComputer() {
	function buildGraph(docs) {
		const forward = new Map();
		const backward = new Map();
		const viaMap = new Map();
		for (const doc of docs) {
			const docVia = new Map();
			for (const ref of doc.references) {
				if (!forward.has(doc.id)) forward.set(doc.id, new Set());
				forward.get(doc.id).add(ref);
				docVia.set(ref, `${doc.id}.references`);
				if (!backward.has(ref)) backward.set(ref, new Set());
				backward.get(ref).add(doc.id);
			}
			for (const use of doc.uses) {
				if (!forward.has(doc.id)) forward.set(doc.id, new Set());
				forward.get(doc.id).add(use);
				if (!docVia.has(use)) docVia.set(use, `${doc.id}.uses`);
				if (!backward.has(use)) backward.set(use, new Set());
				backward.get(use).add(doc.id);
			}
			viaMap.set(doc.id, docVia);
		}
		function expand(resultIds, excludeIds) {
			const seen = new Map();
			for (const resultId of resultIds) {
				const fwd = forward.get(resultId);
				if (fwd) for (const neighborId of fwd) {
					if (excludeIds.has(neighborId) || neighborId === resultId || seen.has(neighborId)) continue;
					seen.set(neighborId, viaMap.get(resultId)?.get(neighborId) ?? `${resultId}.references`);
				}
				const bwd = backward.get(resultId);
				if (bwd) for (const neighborId of bwd) {
					if (excludeIds.has(neighborId) || neighborId === resultId || seen.has(neighborId)) continue;
					seen.set(neighborId, viaMap.get(neighborId)?.get(resultId) ?? `${neighborId}.references`);
				}
			}
			return Array.from(seen.entries()).map(([id, via]) => ({
				id,
				via
			})).sort((a, b) => a.id.localeCompare(b.id));
		}
		return { expand };
	}
	return { buildGraph };
}

//#endregion
//#region ../../node_modules/.pnpm/minisearch@7.2.0/node_modules/minisearch/dist/es/index.js
/** @ignore */
const ENTRIES = "ENTRIES";
/** @ignore */
const KEYS = "KEYS";
/** @ignore */
const VALUES = "VALUES";
/** @ignore */
const LEAF = "";
/**
* @private
*/
var TreeIterator = class {
	constructor(set$1, type$1) {
		const node = set$1._tree;
		const keys = Array.from(node.keys());
		this.set = set$1;
		this._type = type$1;
		this._path = keys.length > 0 ? [{
			node,
			keys
		}] : [];
	}
	next() {
		const value = this.dive();
		this.backtrack();
		return value;
	}
	dive() {
		if (this._path.length === 0) return {
			done: true,
			value: void 0
		};
		const { node, keys } = last$1(this._path);
		if (last$1(keys) === LEAF) return {
			done: false,
			value: this.result()
		};
		const child = node.get(last$1(keys));
		this._path.push({
			node: child,
			keys: Array.from(child.keys())
		});
		return this.dive();
	}
	backtrack() {
		if (this._path.length === 0) return;
		const keys = last$1(this._path).keys;
		keys.pop();
		if (keys.length > 0) return;
		this._path.pop();
		this.backtrack();
	}
	key() {
		return this.set._prefix + this._path.map(({ keys }) => last$1(keys)).filter((key) => key !== LEAF).join("");
	}
	value() {
		return last$1(this._path).node.get(LEAF);
	}
	result() {
		switch (this._type) {
			case VALUES: return this.value();
			case KEYS: return this.key();
			default: return [this.key(), this.value()];
		}
	}
	[Symbol.iterator]() {
		return this;
	}
};
const last$1 = (array) => {
	return array[array.length - 1];
};
/**
* @ignore
*/
const fuzzySearch = (node, query, maxDistance) => {
	const results = new Map();
	if (query === void 0) return results;
	const n = query.length + 1;
	const m = n + maxDistance;
	const matrix = new Uint8Array(m * n).fill(maxDistance + 1);
	for (let j = 0; j < n; ++j) matrix[j] = j;
	for (let i$2 = 1; i$2 < m; ++i$2) matrix[i$2 * n] = i$2;
	recurse(node, query, maxDistance, results, matrix, 1, n, "");
	return results;
};
const recurse = (node, query, maxDistance, results, matrix, m, n, prefix) => {
	const offset = m * n;
	key: for (const key of node.keys()) if (key === LEAF) {
		const distance = matrix[offset - 1];
		if (distance <= maxDistance) results.set(prefix, [node.get(key), distance]);
	} else {
		let i$2 = m;
		for (let pos = 0; pos < key.length; ++pos, ++i$2) {
			const char = key[pos];
			const thisRowOffset = n * i$2;
			const prevRowOffset = thisRowOffset - n;
			let minDistance = matrix[thisRowOffset];
			const jmin = Math.max(0, i$2 - maxDistance - 1);
			const jmax = Math.min(n - 1, i$2 + maxDistance);
			for (let j = jmin; j < jmax; ++j) {
				const different = char !== query[j];
				const rpl = matrix[prevRowOffset + j] + +different;
				const del = matrix[prevRowOffset + j + 1] + 1;
				const ins = matrix[thisRowOffset + j] + 1;
				const dist = matrix[thisRowOffset + j + 1] = Math.min(rpl, del, ins);
				if (dist < minDistance) minDistance = dist;
			}
			if (minDistance > maxDistance) continue key;
		}
		recurse(node.get(key), query, maxDistance, results, matrix, i$2, n, prefix + key);
	}
};
/**
* A class implementing the same interface as a standard JavaScript
* [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
* with string keys, but adding support for efficiently searching entries with
* prefix or fuzzy search. This class is used internally by {@link MiniSearch}
* as the inverted index data structure. The implementation is a radix tree
* (compressed prefix tree).
*
* Since this class can be of general utility beyond _MiniSearch_, it is
* exported by the `minisearch` package and can be imported (or required) as
* `minisearch/SearchableMap`.
*
* @typeParam T  The type of the values stored in the map.
*/
var SearchableMap = class SearchableMap {
	/**
	* The constructor is normally called without arguments, creating an empty
	* map. In order to create a {@link SearchableMap} from an iterable or from an
	* object, check {@link SearchableMap.from} and {@link
	* SearchableMap.fromObject}.
	*
	* The constructor arguments are for internal use, when creating derived
	* mutable views of a map at a prefix.
	*/
	constructor(tree = new Map(), prefix = "") {
		this._size = void 0;
		this._tree = tree;
		this._prefix = prefix;
	}
	/**
	* Creates and returns a mutable view of this {@link SearchableMap},
	* containing only entries that share the given prefix.
	*
	* ### Usage:
	*
	* ```javascript
	* let map = new SearchableMap()
	* map.set("unicorn", 1)
	* map.set("universe", 2)
	* map.set("university", 3)
	* map.set("unique", 4)
	* map.set("hello", 5)
	*
	* let uni = map.atPrefix("uni")
	* uni.get("unique") // => 4
	* uni.get("unicorn") // => 1
	* uni.get("hello") // => undefined
	*
	* let univer = map.atPrefix("univer")
	* univer.get("unique") // => undefined
	* univer.get("universe") // => 2
	* univer.get("university") // => 3
	* ```
	*
	* @param prefix  The prefix
	* @return A {@link SearchableMap} representing a mutable view of the original
	* Map at the given prefix
	*/
	atPrefix(prefix) {
		if (!prefix.startsWith(this._prefix)) throw new Error("Mismatched prefix");
		const [node, path$2] = trackDown(this._tree, prefix.slice(this._prefix.length));
		if (node === void 0) {
			const [parentNode, key] = last(path$2);
			for (const k of parentNode.keys()) if (k !== LEAF && k.startsWith(key)) {
				const node$1 = new Map();
				node$1.set(k.slice(key.length), parentNode.get(k));
				return new SearchableMap(node$1, prefix);
			}
		}
		return new SearchableMap(node, prefix);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/clear
	*/
	clear() {
		this._size = void 0;
		this._tree.clear();
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/delete
	* @param key  Key to delete
	*/
	delete(key) {
		this._size = void 0;
		return remove(this._tree, key);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries
	* @return An iterator iterating through `[key, value]` entries.
	*/
	entries() {
		return new TreeIterator(this, ENTRIES);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach
	* @param fn  Iteration function
	*/
	forEach(fn) {
		for (const [key, value] of this) fn(key, value, this);
	}
	/**
	* Returns a Map of all the entries that have a key within the given edit
	* distance from the search key. The keys of the returned Map are the matching
	* keys, while the values are two-element arrays where the first element is
	* the value associated to the key, and the second is the edit distance of the
	* key to the search key.
	*
	* ### Usage:
	*
	* ```javascript
	* let map = new SearchableMap()
	* map.set('hello', 'world')
	* map.set('hell', 'yeah')
	* map.set('ciao', 'mondo')
	*
	* // Get all entries that match the key 'hallo' with a maximum edit distance of 2
	* map.fuzzyGet('hallo', 2)
	* // => Map(2) { 'hello' => ['world', 1], 'hell' => ['yeah', 2] }
	*
	* // In the example, the "hello" key has value "world" and edit distance of 1
	* // (change "e" to "a"), the key "hell" has value "yeah" and edit distance of 2
	* // (change "e" to "a", delete "o")
	* ```
	*
	* @param key  The search key
	* @param maxEditDistance  The maximum edit distance (Levenshtein)
	* @return A Map of the matching keys to their value and edit distance
	*/
	fuzzyGet(key, maxEditDistance) {
		return fuzzySearch(this._tree, key, maxEditDistance);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get
	* @param key  Key to get
	* @return Value associated to the key, or `undefined` if the key is not
	* found.
	*/
	get(key) {
		const node = lookup(this._tree, key);
		return node !== void 0 ? node.get(LEAF) : void 0;
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
	* @param key  Key
	* @return True if the key is in the map, false otherwise
	*/
	has(key) {
		const node = lookup(this._tree, key);
		return node !== void 0 && node.has(LEAF);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
	* @return An `Iterable` iterating through keys
	*/
	keys() {
		return new TreeIterator(this, KEYS);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set
	* @param key  Key to set
	* @param value  Value to associate to the key
	* @return The {@link SearchableMap} itself, to allow chaining
	*/
	set(key, value) {
		if (typeof key !== "string") throw new Error("key must be a string");
		this._size = void 0;
		const node = createPath(this._tree, key);
		node.set(LEAF, value);
		return this;
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size
	*/
	get size() {
		if (this._size) return this._size;
		/** @ignore */
		this._size = 0;
		const iter = this.entries();
		while (!iter.next().done) this._size += 1;
		return this._size;
	}
	/**
	* Updates the value at the given key using the provided function. The function
	* is called with the current value at the key, and its return value is used as
	* the new value to be set.
	*
	* ### Example:
	*
	* ```javascript
	* // Increment the current value by one
	* searchableMap.update('somekey', (currentValue) => currentValue == null ? 0 : currentValue + 1)
	* ```
	*
	* If the value at the given key is or will be an object, it might not require
	* re-assignment. In that case it is better to use `fetch()`, because it is
	* faster.
	*
	* @param key  The key to update
	* @param fn  The function used to compute the new value from the current one
	* @return The {@link SearchableMap} itself, to allow chaining
	*/
	update(key, fn) {
		if (typeof key !== "string") throw new Error("key must be a string");
		this._size = void 0;
		const node = createPath(this._tree, key);
		node.set(LEAF, fn(node.get(LEAF)));
		return this;
	}
	/**
	* Fetches the value of the given key. If the value does not exist, calls the
	* given function to create a new value, which is inserted at the given key
	* and subsequently returned.
	*
	* ### Example:
	*
	* ```javascript
	* const map = searchableMap.fetch('somekey', () => new Map())
	* map.set('foo', 'bar')
	* ```
	*
	* @param key  The key to update
	* @param initial  A function that creates a new value if the key does not exist
	* @return The existing or new value at the given key
	*/
	fetch(key, initial) {
		if (typeof key !== "string") throw new Error("key must be a string");
		this._size = void 0;
		const node = createPath(this._tree, key);
		let value = node.get(LEAF);
		if (value === void 0) node.set(LEAF, value = initial());
		return value;
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values
	* @return An `Iterable` iterating through values.
	*/
	values() {
		return new TreeIterator(this, VALUES);
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/@@iterator
	*/
	[Symbol.iterator]() {
		return this.entries();
	}
	/**
	* Creates a {@link SearchableMap} from an `Iterable` of entries
	*
	* @param entries  Entries to be inserted in the {@link SearchableMap}
	* @return A new {@link SearchableMap} with the given entries
	*/
	static from(entries) {
		const tree = new SearchableMap();
		for (const [key, value] of entries) tree.set(key, value);
		return tree;
	}
	/**
	* Creates a {@link SearchableMap} from the iterable properties of a JavaScript object
	*
	* @param object  Object of entries for the {@link SearchableMap}
	* @return A new {@link SearchableMap} with the given entries
	*/
	static fromObject(object) {
		return SearchableMap.from(Object.entries(object));
	}
};
const trackDown = (tree, key, path$2 = []) => {
	if (key.length === 0 || tree == null) return [tree, path$2];
	for (const k of tree.keys()) if (k !== LEAF && key.startsWith(k)) {
		path$2.push([tree, k]);
		return trackDown(tree.get(k), key.slice(k.length), path$2);
	}
	path$2.push([tree, key]);
	return trackDown(void 0, "", path$2);
};
const lookup = (tree, key) => {
	if (key.length === 0 || tree == null) return tree;
	for (const k of tree.keys()) if (k !== LEAF && key.startsWith(k)) return lookup(tree.get(k), key.slice(k.length));
};
const createPath = (node, key) => {
	const keyLength = key.length;
	outer: for (let pos = 0; node && pos < keyLength;) {
		for (const k of node.keys()) if (k !== LEAF && key[pos] === k[0]) {
			const len = Math.min(keyLength - pos, k.length);
			let offset = 1;
			while (offset < len && key[pos + offset] === k[offset]) ++offset;
			const child$1 = node.get(k);
			if (offset === k.length) node = child$1;
			else {
				const intermediate = new Map();
				intermediate.set(k.slice(offset), child$1);
				node.set(key.slice(pos, pos + offset), intermediate);
				node.delete(k);
				node = intermediate;
			}
			pos += offset;
			continue outer;
		}
		const child = new Map();
		node.set(key.slice(pos), child);
		return child;
	}
	return node;
};
const remove = (tree, key) => {
	const [node, path$2] = trackDown(tree, key);
	if (node === void 0) return;
	node.delete(LEAF);
	if (node.size === 0) cleanup(path$2);
	else if (node.size === 1) {
		const [key$1, value] = node.entries().next().value;
		merge$1(path$2, key$1, value);
	}
};
const cleanup = (path$2) => {
	if (path$2.length === 0) return;
	const [node, key] = last(path$2);
	node.delete(key);
	if (node.size === 0) cleanup(path$2.slice(0, -1));
	else if (node.size === 1) {
		const [key$1, value] = node.entries().next().value;
		if (key$1 !== LEAF) merge$1(path$2.slice(0, -1), key$1, value);
	}
};
const merge$1 = (path$2, key, value) => {
	if (path$2.length === 0) return;
	const [node, nodeKey] = last(path$2);
	node.set(nodeKey + key, value);
	node.delete(nodeKey);
};
const last = (array) => {
	return array[array.length - 1];
};
const OR = "or";
const AND = "and";
const AND_NOT = "and_not";
/**
* {@link MiniSearch} is the main entrypoint class, implementing a full-text
* search engine in memory.
*
* @typeParam T  The type of the documents being indexed.
*
* ### Basic example:
*
* ```javascript
* const documents = [
*   {
*     id: 1,
*     title: 'Moby Dick',
*     text: 'Call me Ishmael. Some years ago...',
*     category: 'fiction'
*   },
*   {
*     id: 2,
*     title: 'Zen and the Art of Motorcycle Maintenance',
*     text: 'I can see by my watch...',
*     category: 'fiction'
*   },
*   {
*     id: 3,
*     title: 'Neuromancer',
*     text: 'The sky above the port was...',
*     category: 'fiction'
*   },
*   {
*     id: 4,
*     title: 'Zen and the Art of Archery',
*     text: 'At first sight it must seem...',
*     category: 'non-fiction'
*   },
*   // ...and more
* ]
*
* // Create a search engine that indexes the 'title' and 'text' fields for
* // full-text search. Search results will include 'title' and 'category' (plus the
* // id field, that is always stored and returned)
* const miniSearch = new MiniSearch({
*   fields: ['title', 'text'],
*   storeFields: ['title', 'category']
* })
*
* // Add documents to the index
* miniSearch.addAll(documents)
*
* // Search for documents:
* let results = miniSearch.search('zen art motorcycle')
* // => [
* //   { id: 2, title: 'Zen and the Art of Motorcycle Maintenance', category: 'fiction', score: 2.77258 },
* //   { id: 4, title: 'Zen and the Art of Archery', category: 'non-fiction', score: 1.38629 }
* // ]
* ```
*/
var MiniSearch = class MiniSearch {
	/**
	* @param options  Configuration options
	*
	* ### Examples:
	*
	* ```javascript
	* // Create a search engine that indexes the 'title' and 'text' fields of your
	* // documents:
	* const miniSearch = new MiniSearch({ fields: ['title', 'text'] })
	* ```
	*
	* ### ID Field:
	*
	* ```javascript
	* // Your documents are assumed to include a unique 'id' field, but if you want
	* // to use a different field for document identification, you can set the
	* // 'idField' option:
	* const miniSearch = new MiniSearch({ idField: 'key', fields: ['title', 'text'] })
	* ```
	*
	* ### Options and defaults:
	*
	* ```javascript
	* // The full set of options (here with their default value) is:
	* const miniSearch = new MiniSearch({
	*   // idField: field that uniquely identifies a document
	*   idField: 'id',
	*
	*   // extractField: function used to get the value of a field in a document.
	*   // By default, it assumes the document is a flat object with field names as
	*   // property keys and field values as string property values, but custom logic
	*   // can be implemented by setting this option to a custom extractor function.
	*   extractField: (document, fieldName) => document[fieldName],
	*
	*   // tokenize: function used to split fields into individual terms. By
	*   // default, it is also used to tokenize search queries, unless a specific
	*   // `tokenize` search option is supplied. When tokenizing an indexed field,
	*   // the field name is passed as the second argument.
	*   tokenize: (string, _fieldName) => string.split(SPACE_OR_PUNCTUATION),
	*
	*   // processTerm: function used to process each tokenized term before
	*   // indexing. It can be used for stemming and normalization. Return a falsy
	*   // value in order to discard a term. By default, it is also used to process
	*   // search queries, unless a specific `processTerm` option is supplied as a
	*   // search option. When processing a term from a indexed field, the field
	*   // name is passed as the second argument.
	*   processTerm: (term, _fieldName) => term.toLowerCase(),
	*
	*   // searchOptions: default search options, see the `search` method for
	*   // details
	*   searchOptions: undefined,
	*
	*   // fields: document fields to be indexed. Mandatory, but not set by default
	*   fields: undefined
	*
	*   // storeFields: document fields to be stored and returned as part of the
	*   // search results.
	*   storeFields: []
	* })
	* ```
	*/
	constructor(options) {
		if ((options === null || options === void 0 ? void 0 : options.fields) == null) throw new Error("MiniSearch: option \"fields\" must be provided");
		const autoVacuum = options.autoVacuum == null || options.autoVacuum === true ? defaultAutoVacuumOptions : options.autoVacuum;
		this._options = {
			...defaultOptions$2,
			...options,
			autoVacuum,
			searchOptions: {
				...defaultSearchOptions,
				...options.searchOptions || {}
			},
			autoSuggestOptions: {
				...defaultAutoSuggestOptions,
				...options.autoSuggestOptions || {}
			}
		};
		this._index = new SearchableMap();
		this._documentCount = 0;
		this._documentIds = new Map();
		this._idToShortId = new Map();
		this._fieldIds = {};
		this._fieldLength = new Map();
		this._avgFieldLength = [];
		this._nextId = 0;
		this._storedFields = new Map();
		this._dirtCount = 0;
		this._currentVacuum = null;
		this._enqueuedVacuum = null;
		this._enqueuedVacuumConditions = defaultVacuumConditions;
		this.addFields(this._options.fields);
	}
	/**
	* Adds a document to the index
	*
	* @param document  The document to be indexed
	*/
	add(document) {
		const { extractField, stringifyField, tokenize, processTerm, fields, idField } = this._options;
		const id = extractField(document, idField);
		if (id == null) throw new Error(`MiniSearch: document does not have ID field "${idField}"`);
		if (this._idToShortId.has(id)) throw new Error(`MiniSearch: duplicate ID ${id}`);
		const shortDocumentId = this.addDocumentId(id);
		this.saveStoredFields(shortDocumentId, document);
		for (const field of fields) {
			const fieldValue = extractField(document, field);
			if (fieldValue == null) continue;
			const tokens = tokenize(stringifyField(fieldValue, field), field);
			const fieldId = this._fieldIds[field];
			const uniqueTerms = new Set(tokens).size;
			this.addFieldLength(shortDocumentId, fieldId, this._documentCount - 1, uniqueTerms);
			for (const term of tokens) {
				const processedTerm = processTerm(term, field);
				if (Array.isArray(processedTerm)) for (const t of processedTerm) this.addTerm(fieldId, shortDocumentId, t);
				else if (processedTerm) this.addTerm(fieldId, shortDocumentId, processedTerm);
			}
		}
	}
	/**
	* Adds all the given documents to the index
	*
	* @param documents  An array of documents to be indexed
	*/
	addAll(documents) {
		for (const document of documents) this.add(document);
	}
	/**
	* Adds all the given documents to the index asynchronously.
	*
	* Returns a promise that resolves (to `undefined`) when the indexing is done.
	* This method is useful when index many documents, to avoid blocking the main
	* thread. The indexing is performed asynchronously and in chunks.
	*
	* @param documents  An array of documents to be indexed
	* @param options  Configuration options
	* @return A promise resolving to `undefined` when the indexing is done
	*/
	addAllAsync(documents, options = {}) {
		const { chunkSize = 10 } = options;
		const acc = {
			chunk: [],
			promise: Promise.resolve()
		};
		const { chunk, promise } = documents.reduce(({ chunk: chunk$1, promise: promise$1 }, document, i$2) => {
			chunk$1.push(document);
			if ((i$2 + 1) % chunkSize === 0) return {
				chunk: [],
				promise: promise$1.then(() => new Promise((resolve) => setTimeout(resolve, 0))).then(() => this.addAll(chunk$1))
			};
			else return {
				chunk: chunk$1,
				promise: promise$1
			};
		}, acc);
		return promise.then(() => this.addAll(chunk));
	}
	/**
	* Removes the given document from the index.
	*
	* The document to remove must NOT have changed between indexing and removal,
	* otherwise the index will be corrupted.
	*
	* This method requires passing the full document to be removed (not just the
	* ID), and immediately removes the document from the inverted index, allowing
	* memory to be released. A convenient alternative is {@link
	* MiniSearch#discard}, which needs only the document ID, and has the same
	* visible effect, but delays cleaning up the index until the next vacuuming.
	*
	* @param document  The document to be removed
	*/
	remove(document) {
		const { tokenize, processTerm, extractField, stringifyField, fields, idField } = this._options;
		const id = extractField(document, idField);
		if (id == null) throw new Error(`MiniSearch: document does not have ID field "${idField}"`);
		const shortId = this._idToShortId.get(id);
		if (shortId == null) throw new Error(`MiniSearch: cannot remove document with ID ${id}: it is not in the index`);
		for (const field of fields) {
			const fieldValue = extractField(document, field);
			if (fieldValue == null) continue;
			const tokens = tokenize(stringifyField(fieldValue, field), field);
			const fieldId = this._fieldIds[field];
			const uniqueTerms = new Set(tokens).size;
			this.removeFieldLength(shortId, fieldId, this._documentCount, uniqueTerms);
			for (const term of tokens) {
				const processedTerm = processTerm(term, field);
				if (Array.isArray(processedTerm)) for (const t of processedTerm) this.removeTerm(fieldId, shortId, t);
				else if (processedTerm) this.removeTerm(fieldId, shortId, processedTerm);
			}
		}
		this._storedFields.delete(shortId);
		this._documentIds.delete(shortId);
		this._idToShortId.delete(id);
		this._fieldLength.delete(shortId);
		this._documentCount -= 1;
	}
	/**
	* Removes all the given documents from the index. If called with no arguments,
	* it removes _all_ documents from the index.
	*
	* @param documents  The documents to be removed. If this argument is omitted,
	* all documents are removed. Note that, for removing all documents, it is
	* more efficient to call this method with no arguments than to pass all
	* documents.
	*/
	removeAll(documents) {
		if (documents) for (const document of documents) this.remove(document);
		else if (arguments.length > 0) throw new Error("Expected documents to be present. Omit the argument to remove all documents.");
		else {
			this._index = new SearchableMap();
			this._documentCount = 0;
			this._documentIds = new Map();
			this._idToShortId = new Map();
			this._fieldLength = new Map();
			this._avgFieldLength = [];
			this._storedFields = new Map();
			this._nextId = 0;
		}
	}
	/**
	* Discards the document with the given ID, so it won't appear in search results
	*
	* It has the same visible effect of {@link MiniSearch.remove} (both cause the
	* document to stop appearing in searches), but a different effect on the
	* internal data structures:
	*
	*   - {@link MiniSearch#remove} requires passing the full document to be
	*   removed as argument, and removes it from the inverted index immediately.
	*
	*   - {@link MiniSearch#discard} instead only needs the document ID, and
	*   works by marking the current version of the document as discarded, so it
	*   is immediately ignored by searches. This is faster and more convenient
	*   than {@link MiniSearch#remove}, but the index is not immediately
	*   modified. To take care of that, vacuuming is performed after a certain
	*   number of documents are discarded, cleaning up the index and allowing
	*   memory to be released.
	*
	* After discarding a document, it is possible to re-add a new version, and
	* only the new version will appear in searches. In other words, discarding
	* and re-adding a document works exactly like removing and re-adding it. The
	* {@link MiniSearch.replace} method can also be used to replace a document
	* with a new version.
	*
	* #### Details about vacuuming
	*
	* Repetite calls to this method would leave obsolete document references in
	* the index, invisible to searches. Two mechanisms take care of cleaning up:
	* clean up during search, and vacuuming.
	*
	*   - Upon search, whenever a discarded ID is found (and ignored for the
	*   results), references to the discarded document are removed from the
	*   inverted index entries for the search terms. This ensures that subsequent
	*   searches for the same terms do not need to skip these obsolete references
	*   again.
	*
	*   - In addition, vacuuming is performed automatically by default (see the
	*   `autoVacuum` field in {@link Options}) after a certain number of
	*   documents are discarded. Vacuuming traverses all terms in the index,
	*   cleaning up all references to discarded documents. Vacuuming can also be
	*   triggered manually by calling {@link MiniSearch#vacuum}.
	*
	* @param id  The ID of the document to be discarded
	*/
	discard(id) {
		const shortId = this._idToShortId.get(id);
		if (shortId == null) throw new Error(`MiniSearch: cannot discard document with ID ${id}: it is not in the index`);
		this._idToShortId.delete(id);
		this._documentIds.delete(shortId);
		this._storedFields.delete(shortId);
		(this._fieldLength.get(shortId) || []).forEach((fieldLength, fieldId) => {
			this.removeFieldLength(shortId, fieldId, this._documentCount, fieldLength);
		});
		this._fieldLength.delete(shortId);
		this._documentCount -= 1;
		this._dirtCount += 1;
		this.maybeAutoVacuum();
	}
	maybeAutoVacuum() {
		if (this._options.autoVacuum === false) return;
		const { minDirtFactor, minDirtCount, batchSize, batchWait } = this._options.autoVacuum;
		this.conditionalVacuum({
			batchSize,
			batchWait
		}, {
			minDirtCount,
			minDirtFactor
		});
	}
	/**
	* Discards the documents with the given IDs, so they won't appear in search
	* results
	*
	* It is equivalent to calling {@link MiniSearch#discard} for all the given
	* IDs, but with the optimization of triggering at most one automatic
	* vacuuming at the end.
	*
	* Note: to remove all documents from the index, it is faster and more
	* convenient to call {@link MiniSearch.removeAll} with no argument, instead
	* of passing all IDs to this method.
	*/
	discardAll(ids) {
		const autoVacuum = this._options.autoVacuum;
		try {
			this._options.autoVacuum = false;
			for (const id of ids) this.discard(id);
		} finally {
			this._options.autoVacuum = autoVacuum;
		}
		this.maybeAutoVacuum();
	}
	/**
	* It replaces an existing document with the given updated version
	*
	* It works by discarding the current version and adding the updated one, so
	* it is functionally equivalent to calling {@link MiniSearch#discard}
	* followed by {@link MiniSearch#add}. The ID of the updated document should
	* be the same as the original one.
	*
	* Since it uses {@link MiniSearch#discard} internally, this method relies on
	* vacuuming to clean up obsolete document references from the index, allowing
	* memory to be released (see {@link MiniSearch#discard}).
	*
	* @param updatedDocument  The updated document to replace the old version
	* with
	*/
	replace(updatedDocument) {
		const { idField, extractField } = this._options;
		const id = extractField(updatedDocument, idField);
		this.discard(id);
		this.add(updatedDocument);
	}
	/**
	* Triggers a manual vacuuming, cleaning up references to discarded documents
	* from the inverted index
	*
	* Vacuuming is only useful for applications that use the {@link
	* MiniSearch#discard} or {@link MiniSearch#replace} methods.
	*
	* By default, vacuuming is performed automatically when needed (controlled by
	* the `autoVacuum` field in {@link Options}), so there is usually no need to
	* call this method, unless one wants to make sure to perform vacuuming at a
	* specific moment.
	*
	* Vacuuming traverses all terms in the inverted index in batches, and cleans
	* up references to discarded documents from the posting list, allowing memory
	* to be released.
	*
	* The method takes an optional object as argument with the following keys:
	*
	*   - `batchSize`: the size of each batch (1000 by default)
	*
	*   - `batchWait`: the number of milliseconds to wait between batches (10 by
	*   default)
	*
	* On large indexes, vacuuming could have a non-negligible cost: batching
	* avoids blocking the thread for long, diluting this cost so that it is not
	* negatively affecting the application. Nonetheless, this method should only
	* be called when necessary, and relying on automatic vacuuming is usually
	* better.
	*
	* It returns a promise that resolves (to undefined) when the clean up is
	* completed. If vacuuming is already ongoing at the time this method is
	* called, a new one is enqueued immediately after the ongoing one, and a
	* corresponding promise is returned. However, no more than one vacuuming is
	* enqueued on top of the ongoing one, even if this method is called more
	* times (enqueuing multiple ones would be useless).
	*
	* @param options  Configuration options for the batch size and delay. See
	* {@link VacuumOptions}.
	*/
	vacuum(options = {}) {
		return this.conditionalVacuum(options);
	}
	conditionalVacuum(options, conditions) {
		if (this._currentVacuum) {
			this._enqueuedVacuumConditions = this._enqueuedVacuumConditions && conditions;
			if (this._enqueuedVacuum != null) return this._enqueuedVacuum;
			this._enqueuedVacuum = this._currentVacuum.then(() => {
				const conditions$1 = this._enqueuedVacuumConditions;
				this._enqueuedVacuumConditions = defaultVacuumConditions;
				return this.performVacuuming(options, conditions$1);
			});
			return this._enqueuedVacuum;
		}
		if (this.vacuumConditionsMet(conditions) === false) return Promise.resolve();
		this._currentVacuum = this.performVacuuming(options);
		return this._currentVacuum;
	}
	async performVacuuming(options, conditions) {
		const initialDirtCount = this._dirtCount;
		if (this.vacuumConditionsMet(conditions)) {
			const batchSize = options.batchSize || defaultVacuumOptions.batchSize;
			const batchWait = options.batchWait || defaultVacuumOptions.batchWait;
			let i$2 = 1;
			for (const [term, fieldsData] of this._index) {
				for (const [fieldId, fieldIndex] of fieldsData) for (const [shortId] of fieldIndex) {
					if (this._documentIds.has(shortId)) continue;
					if (fieldIndex.size <= 1) fieldsData.delete(fieldId);
					else fieldIndex.delete(shortId);
				}
				if (this._index.get(term).size === 0) this._index.delete(term);
				if (i$2 % batchSize === 0) await new Promise((resolve) => setTimeout(resolve, batchWait));
				i$2 += 1;
			}
			this._dirtCount -= initialDirtCount;
		}
		await null;
		this._currentVacuum = this._enqueuedVacuum;
		this._enqueuedVacuum = null;
	}
	vacuumConditionsMet(conditions) {
		if (conditions == null) return true;
		let { minDirtCount, minDirtFactor } = conditions;
		minDirtCount = minDirtCount || defaultAutoVacuumOptions.minDirtCount;
		minDirtFactor = minDirtFactor || defaultAutoVacuumOptions.minDirtFactor;
		return this.dirtCount >= minDirtCount && this.dirtFactor >= minDirtFactor;
	}
	/**
	* Is `true` if a vacuuming operation is ongoing, `false` otherwise
	*/
	get isVacuuming() {
		return this._currentVacuum != null;
	}
	/**
	* The number of documents discarded since the most recent vacuuming
	*/
	get dirtCount() {
		return this._dirtCount;
	}
	/**
	* A number between 0 and 1 giving an indication about the proportion of
	* documents that are discarded, and can therefore be cleaned up by vacuuming.
	* A value close to 0 means that the index is relatively clean, while a higher
	* value means that the index is relatively dirty, and vacuuming could release
	* memory.
	*/
	get dirtFactor() {
		return this._dirtCount / (1 + this._documentCount + this._dirtCount);
	}
	/**
	* Returns `true` if a document with the given ID is present in the index and
	* available for search, `false` otherwise
	*
	* @param id  The document ID
	*/
	has(id) {
		return this._idToShortId.has(id);
	}
	/**
	* Returns the stored fields (as configured in the `storeFields` constructor
	* option) for the given document ID. Returns `undefined` if the document is
	* not present in the index.
	*
	* @param id  The document ID
	*/
	getStoredFields(id) {
		const shortId = this._idToShortId.get(id);
		if (shortId == null) return void 0;
		return this._storedFields.get(shortId);
	}
	/**
	* Search for documents matching the given search query.
	*
	* The result is a list of scored document IDs matching the query, sorted by
	* descending score, and each including data about which terms were matched and
	* in which fields.
	*
	* ### Basic usage:
	*
	* ```javascript
	* // Search for "zen art motorcycle" with default options: terms have to match
	* // exactly, and individual terms are joined with OR
	* miniSearch.search('zen art motorcycle')
	* // => [ { id: 2, score: 2.77258, match: { ... } }, { id: 4, score: 1.38629, match: { ... } } ]
	* ```
	*
	* ### Restrict search to specific fields:
	*
	* ```javascript
	* // Search only in the 'title' field
	* miniSearch.search('zen', { fields: ['title'] })
	* ```
	*
	* ### Field boosting:
	*
	* ```javascript
	* // Boost a field
	* miniSearch.search('zen', { boost: { title: 2 } })
	* ```
	*
	* ### Prefix search:
	*
	* ```javascript
	* // Search for "moto" with prefix search (it will match documents
	* // containing terms that start with "moto" or "neuro")
	* miniSearch.search('moto neuro', { prefix: true })
	* ```
	*
	* ### Fuzzy search:
	*
	* ```javascript
	* // Search for "ismael" with fuzzy search (it will match documents containing
	* // terms similar to "ismael", with a maximum edit distance of 0.2 term.length
	* // (rounded to nearest integer)
	* miniSearch.search('ismael', { fuzzy: 0.2 })
	* ```
	*
	* ### Combining strategies:
	*
	* ```javascript
	* // Mix of exact match, prefix search, and fuzzy search
	* miniSearch.search('ismael mob', {
	*  prefix: true,
	*  fuzzy: 0.2
	* })
	* ```
	*
	* ### Advanced prefix and fuzzy search:
	*
	* ```javascript
	* // Perform fuzzy and prefix search depending on the search term. Here
	* // performing prefix and fuzzy search only on terms longer than 3 characters
	* miniSearch.search('ismael mob', {
	*  prefix: term => term.length > 3
	*  fuzzy: term => term.length > 3 ? 0.2 : null
	* })
	* ```
	*
	* ### Combine with AND:
	*
	* ```javascript
	* // Combine search terms with AND (to match only documents that contain both
	* // "motorcycle" and "art")
	* miniSearch.search('motorcycle art', { combineWith: 'AND' })
	* ```
	*
	* ### Combine with AND_NOT:
	*
	* There is also an AND_NOT combinator, that finds documents that match the
	* first term, but do not match any of the other terms. This combinator is
	* rarely useful with simple queries, and is meant to be used with advanced
	* query combinations (see later for more details).
	*
	* ### Filtering results:
	*
	* ```javascript
	* // Filter only results in the 'fiction' category (assuming that 'category'
	* // is a stored field)
	* miniSearch.search('motorcycle art', {
	*   filter: (result) => result.category === 'fiction'
	* })
	* ```
	*
	* ### Wildcard query
	*
	* Searching for an empty string (assuming the default tokenizer) returns no
	* results. Sometimes though, one needs to match all documents, like in a
	* "wildcard" search. This is possible by passing the special value
	* {@link MiniSearch.wildcard} as the query:
	*
	* ```javascript
	* // Return search results for all documents
	* miniSearch.search(MiniSearch.wildcard)
	* ```
	*
	* Note that search options such as `filter` and `boostDocument` are still
	* applied, influencing which results are returned, and their order:
	*
	* ```javascript
	* // Return search results for all documents in the 'fiction' category
	* miniSearch.search(MiniSearch.wildcard, {
	*   filter: (result) => result.category === 'fiction'
	* })
	* ```
	*
	* ### Advanced combination of queries:
	*
	* It is possible to combine different subqueries with OR, AND, and AND_NOT,
	* and even with different search options, by passing a query expression
	* tree object as the first argument, instead of a string.
	*
	* ```javascript
	* // Search for documents that contain "zen" and ("motorcycle" or "archery")
	* miniSearch.search({
	*   combineWith: 'AND',
	*   queries: [
	*     'zen',
	*     {
	*       combineWith: 'OR',
	*       queries: ['motorcycle', 'archery']
	*     }
	*   ]
	* })
	*
	* // Search for documents that contain ("apple" or "pear") but not "juice" and
	* // not "tree"
	* miniSearch.search({
	*   combineWith: 'AND_NOT',
	*   queries: [
	*     {
	*       combineWith: 'OR',
	*       queries: ['apple', 'pear']
	*     },
	*     'juice',
	*     'tree'
	*   ]
	* })
	* ```
	*
	* Each node in the expression tree can be either a string, or an object that
	* supports all {@link SearchOptions} fields, plus a `queries` array field for
	* subqueries.
	*
	* Note that, while this can become complicated to do by hand for complex or
	* deeply nested queries, it provides a formalized expression tree API for
	* external libraries that implement a parser for custom query languages.
	*
	* @param query  Search query
	* @param searchOptions  Search options. Each option, if not given, defaults to the corresponding value of `searchOptions` given to the constructor, or to the library default.
	*/
	search(query, searchOptions = {}) {
		const { searchOptions: globalSearchOptions } = this._options;
		const searchOptionsWithDefaults = {
			...globalSearchOptions,
			...searchOptions
		};
		const rawResults = this.executeQuery(query, searchOptions);
		const results = [];
		for (const [docId, { score, terms, match }] of rawResults) {
			const quality = terms.length || 1;
			const result = {
				id: this._documentIds.get(docId),
				score: score * quality,
				terms: Object.keys(match),
				queryTerms: terms,
				match
			};
			Object.assign(result, this._storedFields.get(docId));
			if (searchOptionsWithDefaults.filter == null || searchOptionsWithDefaults.filter(result)) results.push(result);
		}
		if (query === MiniSearch.wildcard && searchOptionsWithDefaults.boostDocument == null) return results;
		results.sort(byScore);
		return results;
	}
	/**
	* Provide suggestions for the given search query
	*
	* The result is a list of suggested modified search queries, derived from the
	* given search query, each with a relevance score, sorted by descending score.
	*
	* By default, it uses the same options used for search, except that by
	* default it performs prefix search on the last term of the query, and
	* combine terms with `'AND'` (requiring all query terms to match). Custom
	* options can be passed as a second argument. Defaults can be changed upon
	* calling the {@link MiniSearch} constructor, by passing a
	* `autoSuggestOptions` option.
	*
	* ### Basic usage:
	*
	* ```javascript
	* // Get suggestions for 'neuro':
	* miniSearch.autoSuggest('neuro')
	* // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 0.46240 } ]
	* ```
	*
	* ### Multiple words:
	*
	* ```javascript
	* // Get suggestions for 'zen ar':
	* miniSearch.autoSuggest('zen ar')
	* // => [
	* //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
	* //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
	* // ]
	* ```
	*
	* ### Fuzzy suggestions:
	*
	* ```javascript
	* // Correct spelling mistakes using fuzzy search:
	* miniSearch.autoSuggest('neromancer', { fuzzy: 0.2 })
	* // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 1.03998 } ]
	* ```
	*
	* ### Filtering:
	*
	* ```javascript
	* // Get suggestions for 'zen ar', but only within the 'fiction' category
	* // (assuming that 'category' is a stored field):
	* miniSearch.autoSuggest('zen ar', {
	*   filter: (result) => result.category === 'fiction'
	* })
	* // => [
	* //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
	* //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
	* // ]
	* ```
	*
	* @param queryString  Query string to be expanded into suggestions
	* @param options  Search options. The supported options and default values
	* are the same as for the {@link MiniSearch#search} method, except that by
	* default prefix search is performed on the last term in the query, and terms
	* are combined with `'AND'`.
	* @return  A sorted array of suggestions sorted by relevance score.
	*/
	autoSuggest(queryString, options = {}) {
		options = {
			...this._options.autoSuggestOptions,
			...options
		};
		const suggestions = new Map();
		for (const { score, terms } of this.search(queryString, options)) {
			const phrase = terms.join(" ");
			const suggestion = suggestions.get(phrase);
			if (suggestion != null) {
				suggestion.score += score;
				suggestion.count += 1;
			} else suggestions.set(phrase, {
				score,
				terms,
				count: 1
			});
		}
		const results = [];
		for (const [suggestion, { score, terms, count }] of suggestions) results.push({
			suggestion,
			terms,
			score: score / count
		});
		results.sort(byScore);
		return results;
	}
	/**
	* Total number of documents available to search
	*/
	get documentCount() {
		return this._documentCount;
	}
	/**
	* Number of terms in the index
	*/
	get termCount() {
		return this._index.size;
	}
	/**
	* Deserializes a JSON index (serialized with `JSON.stringify(miniSearch)`)
	* and instantiates a MiniSearch instance. It should be given the same options
	* originally used when serializing the index.
	*
	* ### Usage:
	*
	* ```javascript
	* // If the index was serialized with:
	* let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
	* miniSearch.addAll(documents)
	*
	* const json = JSON.stringify(miniSearch)
	* // It can later be deserialized like this:
	* miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
	* ```
	*
	* @param json  JSON-serialized index
	* @param options  configuration options, same as the constructor
	* @return An instance of MiniSearch deserialized from the given JSON.
	*/
	static loadJSON(json$1, options) {
		if (options == null) throw new Error("MiniSearch: loadJSON should be given the same options used when serializing the index");
		return this.loadJS(JSON.parse(json$1), options);
	}
	/**
	* Async equivalent of {@link MiniSearch.loadJSON}
	*
	* This function is an alternative to {@link MiniSearch.loadJSON} that returns
	* a promise, and loads the index in batches, leaving pauses between them to avoid
	* blocking the main thread. It tends to be slower than the synchronous
	* version, but does not block the main thread, so it can be a better choice
	* when deserializing very large indexes.
	*
	* @param json  JSON-serialized index
	* @param options  configuration options, same as the constructor
	* @return A Promise that will resolve to an instance of MiniSearch deserialized from the given JSON.
	*/
	static async loadJSONAsync(json$1, options) {
		if (options == null) throw new Error("MiniSearch: loadJSON should be given the same options used when serializing the index");
		return this.loadJSAsync(JSON.parse(json$1), options);
	}
	/**
	* Returns the default value of an option. It will throw an error if no option
	* with the given name exists.
	*
	* @param optionName  Name of the option
	* @return The default value of the given option
	*
	* ### Usage:
	*
	* ```javascript
	* // Get default tokenizer
	* MiniSearch.getDefault('tokenize')
	*
	* // Get default term processor
	* MiniSearch.getDefault('processTerm')
	*
	* // Unknown options will throw an error
	* MiniSearch.getDefault('notExisting')
	* // => throws 'MiniSearch: unknown option "notExisting"'
	* ```
	*/
	static getDefault(optionName) {
		if (defaultOptions$2.hasOwnProperty(optionName)) return getOwnProperty(defaultOptions$2, optionName);
		else throw new Error(`MiniSearch: unknown option "${optionName}"`);
	}
	/**
	* @ignore
	*/
	static loadJS(js, options) {
		const { index, documentIds, fieldLength, storedFields, serializationVersion } = js;
		const miniSearch = this.instantiateMiniSearch(js, options);
		miniSearch._documentIds = objectToNumericMap(documentIds);
		miniSearch._fieldLength = objectToNumericMap(fieldLength);
		miniSearch._storedFields = objectToNumericMap(storedFields);
		for (const [shortId, id] of miniSearch._documentIds) miniSearch._idToShortId.set(id, shortId);
		for (const [term, data] of index) {
			const dataMap = new Map();
			for (const fieldId of Object.keys(data)) {
				let indexEntry = data[fieldId];
				if (serializationVersion === 1) indexEntry = indexEntry.ds;
				dataMap.set(parseInt(fieldId, 10), objectToNumericMap(indexEntry));
			}
			miniSearch._index.set(term, dataMap);
		}
		return miniSearch;
	}
	/**
	* @ignore
	*/
	static async loadJSAsync(js, options) {
		const { index, documentIds, fieldLength, storedFields, serializationVersion } = js;
		const miniSearch = this.instantiateMiniSearch(js, options);
		miniSearch._documentIds = await objectToNumericMapAsync(documentIds);
		miniSearch._fieldLength = await objectToNumericMapAsync(fieldLength);
		miniSearch._storedFields = await objectToNumericMapAsync(storedFields);
		for (const [shortId, id] of miniSearch._documentIds) miniSearch._idToShortId.set(id, shortId);
		let count = 0;
		for (const [term, data] of index) {
			const dataMap = new Map();
			for (const fieldId of Object.keys(data)) {
				let indexEntry = data[fieldId];
				if (serializationVersion === 1) indexEntry = indexEntry.ds;
				dataMap.set(parseInt(fieldId, 10), await objectToNumericMapAsync(indexEntry));
			}
			if (++count % 1e3 === 0) await wait(0);
			miniSearch._index.set(term, dataMap);
		}
		return miniSearch;
	}
	/**
	* @ignore
	*/
	static instantiateMiniSearch(js, options) {
		const { documentCount, nextId, fieldIds, averageFieldLength, dirtCount, serializationVersion } = js;
		if (serializationVersion !== 1 && serializationVersion !== 2) throw new Error("MiniSearch: cannot deserialize an index created with an incompatible version");
		const miniSearch = new MiniSearch(options);
		miniSearch._documentCount = documentCount;
		miniSearch._nextId = nextId;
		miniSearch._idToShortId = new Map();
		miniSearch._fieldIds = fieldIds;
		miniSearch._avgFieldLength = averageFieldLength;
		miniSearch._dirtCount = dirtCount || 0;
		miniSearch._index = new SearchableMap();
		return miniSearch;
	}
	/**
	* @ignore
	*/
	executeQuery(query, searchOptions = {}) {
		if (query === MiniSearch.wildcard) return this.executeWildcardQuery(searchOptions);
		if (typeof query !== "string") {
			const options$1 = {
				...searchOptions,
				...query,
				queries: void 0
			};
			const results$1 = query.queries.map((subquery) => this.executeQuery(subquery, options$1));
			return this.combineResults(results$1, options$1.combineWith);
		}
		const { tokenize, processTerm, searchOptions: globalSearchOptions } = this._options;
		const options = {
			tokenize,
			processTerm,
			...globalSearchOptions,
			...searchOptions
		};
		const { tokenize: searchTokenize, processTerm: searchProcessTerm } = options;
		const terms = searchTokenize(query).flatMap((term) => searchProcessTerm(term)).filter((term) => !!term);
		const queries = terms.map(termToQuerySpec(options));
		const results = queries.map((query$1) => this.executeQuerySpec(query$1, options));
		return this.combineResults(results, options.combineWith);
	}
	/**
	* @ignore
	*/
	executeQuerySpec(query, searchOptions) {
		const options = {
			...this._options.searchOptions,
			...searchOptions
		};
		const boosts = (options.fields || this._options.fields).reduce((boosts$1, field) => ({
			...boosts$1,
			[field]: getOwnProperty(options.boost, field) || 1
		}), {});
		const { boostDocument, weights, maxFuzzy, bm25: bm25params } = options;
		const { fuzzy: fuzzyWeight, prefix: prefixWeight } = {
			...defaultSearchOptions.weights,
			...weights
		};
		const data = this._index.get(query.term);
		const results = this.termResults(query.term, query.term, 1, query.termBoost, data, boosts, boostDocument, bm25params);
		let prefixMatches;
		let fuzzyMatches;
		if (query.prefix) prefixMatches = this._index.atPrefix(query.term);
		if (query.fuzzy) {
			const fuzzy = query.fuzzy === true ? .2 : query.fuzzy;
			const maxDistance = fuzzy < 1 ? Math.min(maxFuzzy, Math.round(query.term.length * fuzzy)) : fuzzy;
			if (maxDistance) fuzzyMatches = this._index.fuzzyGet(query.term, maxDistance);
		}
		if (prefixMatches) for (const [term, data$1] of prefixMatches) {
			const distance = term.length - query.term.length;
			if (!distance) continue;
			fuzzyMatches === null || fuzzyMatches === void 0 || fuzzyMatches.delete(term);
			const weight = prefixWeight * term.length / (term.length + .3 * distance);
			this.termResults(query.term, term, weight, query.termBoost, data$1, boosts, boostDocument, bm25params, results);
		}
		if (fuzzyMatches) for (const term of fuzzyMatches.keys()) {
			const [data$1, distance] = fuzzyMatches.get(term);
			if (!distance) continue;
			const weight = fuzzyWeight * term.length / (term.length + distance);
			this.termResults(query.term, term, weight, query.termBoost, data$1, boosts, boostDocument, bm25params, results);
		}
		return results;
	}
	/**
	* @ignore
	*/
	executeWildcardQuery(searchOptions) {
		const results = new Map();
		const options = {
			...this._options.searchOptions,
			...searchOptions
		};
		for (const [shortId, id] of this._documentIds) {
			const score = options.boostDocument ? options.boostDocument(id, "", this._storedFields.get(shortId)) : 1;
			results.set(shortId, {
				score,
				terms: [],
				match: {}
			});
		}
		return results;
	}
	/**
	* @ignore
	*/
	combineResults(results, combineWith = OR) {
		if (results.length === 0) return new Map();
		const operator = combineWith.toLowerCase();
		const combinator = combinators[operator];
		if (!combinator) throw new Error(`Invalid combination operator: ${combineWith}`);
		return results.reduce(combinator) || new Map();
	}
	/**
	* Allows serialization of the index to JSON, to possibly store it and later
	* deserialize it with {@link MiniSearch.loadJSON}.
	*
	* Normally one does not directly call this method, but rather call the
	* standard JavaScript `JSON.stringify()` passing the {@link MiniSearch}
	* instance, and JavaScript will internally call this method. Upon
	* deserialization, one must pass to {@link MiniSearch.loadJSON} the same
	* options used to create the original instance that was serialized.
	*
	* ### Usage:
	*
	* ```javascript
	* // Serialize the index:
	* let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
	* miniSearch.addAll(documents)
	* const json = JSON.stringify(miniSearch)
	*
	* // Later, to deserialize it:
	* miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
	* ```
	*
	* @return A plain-object serializable representation of the search index.
	*/
	toJSON() {
		const index = [];
		for (const [term, fieldIndex] of this._index) {
			const data = {};
			for (const [fieldId, freqs] of fieldIndex) data[fieldId] = Object.fromEntries(freqs);
			index.push([term, data]);
		}
		return {
			documentCount: this._documentCount,
			nextId: this._nextId,
			documentIds: Object.fromEntries(this._documentIds),
			fieldIds: this._fieldIds,
			fieldLength: Object.fromEntries(this._fieldLength),
			averageFieldLength: this._avgFieldLength,
			storedFields: Object.fromEntries(this._storedFields),
			dirtCount: this._dirtCount,
			index,
			serializationVersion: 2
		};
	}
	/**
	* @ignore
	*/
	termResults(sourceTerm, derivedTerm, termWeight, termBoost, fieldTermData, fieldBoosts, boostDocumentFn, bm25params, results = new Map()) {
		if (fieldTermData == null) return results;
		for (const field of Object.keys(fieldBoosts)) {
			const fieldBoost = fieldBoosts[field];
			const fieldId = this._fieldIds[field];
			const fieldTermFreqs = fieldTermData.get(fieldId);
			if (fieldTermFreqs == null) continue;
			let matchingFields = fieldTermFreqs.size;
			const avgFieldLength = this._avgFieldLength[fieldId];
			for (const docId of fieldTermFreqs.keys()) {
				if (!this._documentIds.has(docId)) {
					this.removeTerm(fieldId, docId, derivedTerm);
					matchingFields -= 1;
					continue;
				}
				const docBoost = boostDocumentFn ? boostDocumentFn(this._documentIds.get(docId), derivedTerm, this._storedFields.get(docId)) : 1;
				if (!docBoost) continue;
				const termFreq = fieldTermFreqs.get(docId);
				const fieldLength = this._fieldLength.get(docId)[fieldId];
				const rawScore = calcBM25Score(termFreq, matchingFields, this._documentCount, fieldLength, avgFieldLength, bm25params);
				const weightedScore = termWeight * termBoost * fieldBoost * docBoost * rawScore;
				const result = results.get(docId);
				if (result) {
					result.score += weightedScore;
					assignUniqueTerm(result.terms, sourceTerm);
					const match = getOwnProperty(result.match, derivedTerm);
					if (match) match.push(field);
					else result.match[derivedTerm] = [field];
				} else results.set(docId, {
					score: weightedScore,
					terms: [sourceTerm],
					match: { [derivedTerm]: [field] }
				});
			}
		}
		return results;
	}
	/**
	* @ignore
	*/
	addTerm(fieldId, documentId, term) {
		const indexData = this._index.fetch(term, createMap);
		let fieldIndex = indexData.get(fieldId);
		if (fieldIndex == null) {
			fieldIndex = new Map();
			fieldIndex.set(documentId, 1);
			indexData.set(fieldId, fieldIndex);
		} else {
			const docs = fieldIndex.get(documentId);
			fieldIndex.set(documentId, (docs || 0) + 1);
		}
	}
	/**
	* @ignore
	*/
	removeTerm(fieldId, documentId, term) {
		if (!this._index.has(term)) {
			this.warnDocumentChanged(documentId, fieldId, term);
			return;
		}
		const indexData = this._index.fetch(term, createMap);
		const fieldIndex = indexData.get(fieldId);
		if (fieldIndex == null || fieldIndex.get(documentId) == null) this.warnDocumentChanged(documentId, fieldId, term);
		else if (fieldIndex.get(documentId) <= 1) if (fieldIndex.size <= 1) indexData.delete(fieldId);
		else fieldIndex.delete(documentId);
		else fieldIndex.set(documentId, fieldIndex.get(documentId) - 1);
		if (this._index.get(term).size === 0) this._index.delete(term);
	}
	/**
	* @ignore
	*/
	warnDocumentChanged(shortDocumentId, fieldId, term) {
		for (const fieldName of Object.keys(this._fieldIds)) if (this._fieldIds[fieldName] === fieldId) {
			this._options.logger("warn", `MiniSearch: document with ID ${this._documentIds.get(shortDocumentId)} has changed before removal: term "${term}" was not present in field "${fieldName}". Removing a document after it has changed can corrupt the index!`, "version_conflict");
			return;
		}
	}
	/**
	* @ignore
	*/
	addDocumentId(documentId) {
		const shortDocumentId = this._nextId;
		this._idToShortId.set(documentId, shortDocumentId);
		this._documentIds.set(shortDocumentId, documentId);
		this._documentCount += 1;
		this._nextId += 1;
		return shortDocumentId;
	}
	/**
	* @ignore
	*/
	addFields(fields) {
		for (let i$2 = 0; i$2 < fields.length; i$2++) this._fieldIds[fields[i$2]] = i$2;
	}
	/**
	* @ignore
	*/
	addFieldLength(documentId, fieldId, count, length) {
		let fieldLengths = this._fieldLength.get(documentId);
		if (fieldLengths == null) this._fieldLength.set(documentId, fieldLengths = []);
		fieldLengths[fieldId] = length;
		const averageFieldLength = this._avgFieldLength[fieldId] || 0;
		const totalFieldLength = averageFieldLength * count + length;
		this._avgFieldLength[fieldId] = totalFieldLength / (count + 1);
	}
	/**
	* @ignore
	*/
	removeFieldLength(documentId, fieldId, count, length) {
		if (count === 1) {
			this._avgFieldLength[fieldId] = 0;
			return;
		}
		const totalFieldLength = this._avgFieldLength[fieldId] * count - length;
		this._avgFieldLength[fieldId] = totalFieldLength / (count - 1);
	}
	/**
	* @ignore
	*/
	saveStoredFields(documentId, doc) {
		const { storeFields, extractField } = this._options;
		if (storeFields == null || storeFields.length === 0) return;
		let documentFields = this._storedFields.get(documentId);
		if (documentFields == null) this._storedFields.set(documentId, documentFields = {});
		for (const fieldName of storeFields) {
			const fieldValue = extractField(doc, fieldName);
			if (fieldValue !== void 0) documentFields[fieldName] = fieldValue;
		}
	}
};
/**
* The special wildcard symbol that can be passed to {@link MiniSearch#search}
* to match all documents
*/
MiniSearch.wildcard = Symbol("*");
const getOwnProperty = (object, property) => Object.prototype.hasOwnProperty.call(object, property) ? object[property] : void 0;
const combinators = {
	[OR]: (a, b) => {
		for (const docId of b.keys()) {
			const existing = a.get(docId);
			if (existing == null) a.set(docId, b.get(docId));
			else {
				const { score, terms, match } = b.get(docId);
				existing.score = existing.score + score;
				existing.match = Object.assign(existing.match, match);
				assignUniqueTerms(existing.terms, terms);
			}
		}
		return a;
	},
	[AND]: (a, b) => {
		const combined = new Map();
		for (const docId of b.keys()) {
			const existing = a.get(docId);
			if (existing == null) continue;
			const { score, terms, match } = b.get(docId);
			assignUniqueTerms(existing.terms, terms);
			combined.set(docId, {
				score: existing.score + score,
				terms: existing.terms,
				match: Object.assign(existing.match, match)
			});
		}
		return combined;
	},
	[AND_NOT]: (a, b) => {
		for (const docId of b.keys()) a.delete(docId);
		return a;
	}
};
const defaultBM25params = {
	k: 1.2,
	b: .7,
	d: .5
};
const calcBM25Score = (termFreq, matchingCount, totalCount, fieldLength, avgFieldLength, bm25params) => {
	const { k, b, d } = bm25params;
	const invDocFreq = Math.log(1 + (totalCount - matchingCount + .5) / (matchingCount + .5));
	return invDocFreq * (d + termFreq * (k + 1) / (termFreq + k * (1 - b + b * fieldLength / avgFieldLength)));
};
const termToQuerySpec = (options) => (term, i$2, terms) => {
	const fuzzy = typeof options.fuzzy === "function" ? options.fuzzy(term, i$2, terms) : options.fuzzy || false;
	const prefix = typeof options.prefix === "function" ? options.prefix(term, i$2, terms) : options.prefix === true;
	const termBoost = typeof options.boostTerm === "function" ? options.boostTerm(term, i$2, terms) : 1;
	return {
		term,
		fuzzy,
		prefix,
		termBoost
	};
};
const defaultOptions$2 = {
	idField: "id",
	extractField: (document, fieldName) => document[fieldName],
	stringifyField: (fieldValue, fieldName) => fieldValue.toString(),
	tokenize: (text) => text.split(SPACE_OR_PUNCTUATION),
	processTerm: (term) => term.toLowerCase(),
	fields: void 0,
	searchOptions: void 0,
	storeFields: [],
	logger: (level, message) => {
		if (typeof (console === null || console === void 0 ? void 0 : console[level]) === "function") console[level](message);
	},
	autoVacuum: true
};
const defaultSearchOptions = {
	combineWith: OR,
	prefix: false,
	fuzzy: false,
	maxFuzzy: 6,
	boost: {},
	weights: {
		fuzzy: .45,
		prefix: .375
	},
	bm25: defaultBM25params
};
const defaultAutoSuggestOptions = {
	combineWith: AND,
	prefix: (term, i$2, terms) => i$2 === terms.length - 1
};
const defaultVacuumOptions = {
	batchSize: 1e3,
	batchWait: 10
};
const defaultVacuumConditions = {
	minDirtFactor: .1,
	minDirtCount: 20
};
const defaultAutoVacuumOptions = {
	...defaultVacuumOptions,
	...defaultVacuumConditions
};
const assignUniqueTerm = (target, term) => {
	if (!target.includes(term)) target.push(term);
};
const assignUniqueTerms = (target, source) => {
	for (const term of source) if (!target.includes(term)) target.push(term);
};
const byScore = ({ score: a }, { score: b }) => b - a;
const createMap = () => new Map();
const objectToNumericMap = (object) => {
	const map$1 = new Map();
	for (const key of Object.keys(object)) map$1.set(parseInt(key, 10), object[key]);
	return map$1;
};
const objectToNumericMapAsync = async (object) => {
	const map$1 = new Map();
	let count = 0;
	for (const key of Object.keys(object)) {
		map$1.set(parseInt(key, 10), object[key]);
		if (++count % 1e3 === 0) await wait(0);
	}
	return map$1;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SPACE_OR_PUNCTUATION = /[\n\r\p{Z}\p{P}]+/u;

//#endregion
//#region src/cli/computers/search.computer.ts
/**
* Normalize BM25 scores to 0-1 range by dividing by max score.
*
* Preserves relative ranking. Returns empty array for empty input.
* Guards against division by zero when max score is 0.
*
* @param results - Raw scored results from MiniSearch.
* @returns Results with scores in 0-1 range.
*/
function normalizeScores(results) {
	if (results.length === 0) return [];
	const maxScore = results.reduce((max, r) => r.score > max ? r.score : max, 0);
	if (maxScore <= 0) return results;
	return results.map((r) => ({
		item: r.item,
		score: r.score / maxScore
	}));
}
/**
* Create a search computer using MiniSearch BM25+ scoring.
*
* @returns A SearchComputer instance with BM25+ indexing and normalized scoring.
*/
function createSearchComputer() {
	function createIndex(items, config) {
		const itemsById = new Map(items.map((item) => [item.id, item]));
		const miniSearch = new MiniSearch({
			fields: [...config.fields],
			idField: "id",
			extractField: (document, fieldName) => {
				const value = document[fieldName];
				if (Array.isArray(value)) return value.join(" ");
				return typeof value === "string" ? value : "";
			}
		});
		for (const item of items) try {
			miniSearch.add(item);
		} catch {
			console.warn(`Skipping malformed doc during indexing: ${item.id}`);
		}
		return { search: (terms) => {
			const query = terms.join(" ");
			if (!query.trim()) return [];
			const results = miniSearch.search(query, {
				boost: { ...config.boosts },
				combineWith: "OR",
				prefix: true,
				fuzzy: .2
			});
			const scored = results.map((r) => {
				const item = itemsById.get(String(r.id));
				return item ? {
					item,
					score: r.score
				} : void 0;
			}).filter((r) => r !== void 0);
			return normalizeScores(scored);
		} };
	}
	function checkBoundaryMatch(boundary, terms) {
		if (!boundary) return false;
		const boundaryLower = boundary.toLowerCase();
		return terms.some((term) => boundaryLower.includes(term.toLowerCase()));
	}
	return {
		createIndex,
		checkBoundaryMatch
	};
}

//#endregion
//#region src/cli/handlers/search.handler.ts
const PRODUCT_DIR$1 = ".festinalente/product";
const ENGINEERING_DIR$1 = ".festinalente/engineering";
const DEFAULT_MIN_SCORE = .3;
const BODY_SLICE_LENGTH = 1e3;
const BOUNDARY_PENALTY = .15;
/**
* Create a search handler.
*
* @param deps - The dependencies.
* @returns A SearchHandler instance.
*/
function createSearchHandler(deps) {
	const { fs: fs$3, yamlParser, search, graph } = deps;
	/**
	* Derive ID and domain from product file path.
	*/
	function deriveProductIdAndDomain(filePath) {
		const relativePath = fs$3.relativePath(PRODUCT_DIR$1, filePath).replace(/\\/g, "/");
		const withoutExt = relativePath.replace(/\.md$/, "");
		const parts = withoutExt.split("/");
		if (parts.length === 1) return {
			id: parts[0],
			domain: null
		};
		return {
			id: withoutExt,
			domain: parts[0]
		};
	}
	/**
	* Derive ID and system from engineering file path.
	*/
	function deriveEngineeringIdAndSystem(filePath) {
		const relativePath = fs$3.relativePath(ENGINEERING_DIR$1, filePath).replace(/\\/g, "/");
		const withoutExt = relativePath.replace(/\.md$/, "");
		const parts = withoutExt.split("/");
		if (parts.length === 1) return {
			id: parts[0],
			system: null
		};
		if (parts[0] === "systems") {
			if (parts.length === 3 && parts[2] === "_index") return {
				id: `${parts[0]}/${parts[1]}`,
				system: null
			};
			else if (parts.length === 3) return {
				id: withoutExt,
				system: parts[1]
			};
			else if (parts.length === 2) return {
				id: withoutExt,
				system: null
			};
		}
		return {
			id: withoutExt,
			system: null
		};
	}
	/**
	* Load documents from a directory.
	*/
	function loadDocs(dir, docType) {
		const scanResult = fs$3.scanRecursive(dir, ".md");
		if (!scanResult.ok) return [];
		const docs = [];
		for (const filePath of scanResult.value) {
			const normalizedPath = filePath.replace(/\\/g, "/");
			const readResult = fs$3.readFile(filePath);
			if (!readResult.ok) continue;
			const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
			let id;
			let domain = null;
			let system = null;
			if (docType === "product") {
				const derived = deriveProductIdAndDomain(filePath);
				id = frontmatter.id || derived.id;
				domain = derived.domain;
			} else {
				const derived = deriveEngineeringIdAndSystem(filePath);
				id = frontmatter.id || derived.id;
				system = derived.system;
			}
			docs.push({
				id,
				title: frontmatter.title || "",
				type: frontmatter.type || (docType === "product" ? "feature" : "pattern"),
				tldr: frontmatter.tldr || "",
				summary: frontmatter.summary || "",
				keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
				aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
				boundary: frontmatter.boundary || "",
				body: body.slice(0, BODY_SLICE_LENGTH),
				path: normalizedPath,
				docType,
				domain,
				system,
				paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
				references: Array.isArray(frontmatter.references) ? frontmatter.references : [],
				uses: Array.isArray(frontmatter.uses) ? frontmatter.uses : []
			});
		}
		return docs;
	}
	/**
	* Get search config for product docs.
	*/
	function getProductSearchConfig() {
		return {
			fields: [
				"keywords",
				"aliases",
				"title",
				"tldr",
				"id",
				"summary",
				"domain",
				"body"
			],
			boosts: {
				keywords: 7,
				aliases: 7,
				title: 5,
				tldr: 5,
				id: 4,
				summary: 3,
				domain: 2,
				body: 1
			}
		};
	}
	/**
	* Get search config for engineering docs.
	*/
	function getEngineeringSearchConfig() {
		return {
			fields: [
				"keywords",
				"aliases",
				"title",
				"tldr",
				"id",
				"summary",
				"system",
				"paths",
				"body"
			],
			boosts: {
				keywords: 7,
				aliases: 7,
				title: 5,
				tldr: 5,
				id: 4,
				summary: 3,
				system: 2,
				paths: 2,
				body: 1
			}
		};
	}
	/**
	* Get unified search config for hybrid search (all fields).
	*/
	function getHybridSearchConfig() {
		return {
			fields: [
				"keywords",
				"aliases",
				"title",
				"tldr",
				"id",
				"summary",
				"domain",
				"system",
				"paths",
				"body"
			],
			boosts: {
				keywords: 7,
				aliases: 7,
				title: 5,
				tldr: 5,
				id: 4,
				summary: 3,
				domain: 2,
				system: 2,
				paths: 2,
				body: 1
			}
		};
	}
	/**
	* Build graph-expanded related docs from search results.
	*/
	function buildRelatedDocs(docs, resultIds) {
		const adjacency = graph.buildGraph(docs);
		const excludeIds = new Set(resultIds);
		const edges = adjacency.expand(resultIds, excludeIds);
		const docsById = new Map(docs.map((d) => [d.id, d]));
		return edges.map((edge) => {
			const doc = docsById.get(edge.id);
			return doc ? {
				id: edge.id,
				tldr: doc.tldr,
				via: edge.via
			} : void 0;
		}).filter((r) => r !== void 0);
	}
	/**
	* Execute search on docs.
	*/
	function executeSearch(docs, searchTerms, config, minScore) {
		if (docs.length === 0) return {
			results: [],
			relatedDocs: []
		};
		const index = search.createIndex(docs, config);
		const searchResults = index.search(searchTerms);
		const results = searchResults.map((result) => {
			const doc = result.item;
			const baseScore = result.score;
			const hasBoundaryMatch = search.checkBoundaryMatch(doc.boundary, searchTerms);
			const adjustedScore = hasBoundaryMatch ? Math.max(0, baseScore - BOUNDARY_PENALTY) : baseScore;
			return {
				id: doc.id,
				title: doc.title,
				score: Math.round(adjustedScore * 100) / 100,
				summary: doc.summary,
				tldr: doc.tldr,
				path: doc.path,
				boundaryPenalty: hasBoundaryMatch,
				references: doc.references,
				uses: doc.uses
			};
		}).filter((result) => result.score >= minScore).sort((a, b) => b.score - a.score);
		const relatedDocs = buildRelatedDocs(docs, results.map((r) => r.id));
		return {
			results,
			relatedDocs
		};
	}
	/**
	* Search product docs command.
	*/
	function searchProduct(args) {
		const parsed = parseArgs(args);
		const searchTerms = parsed.positional;
		const minScore = getNumberFlag(parsed.flags, "min-score") ?? DEFAULT_MIN_SCORE;
		if (searchTerms.length === 0) return error("Usage: search-product keyword1 keyword2 ... [--min-score=0.3]");
		if (!fs$3.exists(PRODUCT_DIR$1)) return error(`${PRODUCT_DIR$1}/ directory not found. Run npx festinalente first.`);
		const docs = loadDocs(PRODUCT_DIR$1, "product");
		const { results, relatedDocs } = executeSearch(docs, searchTerms, getProductSearchConfig(), minScore);
		return success({
			query: searchTerms,
			count: results.length,
			docs: results,
			relatedDocs
		});
	}
	/**
	* Search engineering docs command.
	*/
	function searchEngineering(args) {
		const parsed = parseArgs(args);
		const searchTerms = parsed.positional;
		const minScore = getNumberFlag(parsed.flags, "min-score") ?? DEFAULT_MIN_SCORE;
		if (searchTerms.length === 0) return error("Usage: search-engineering keyword1 keyword2 ... [--min-score=0.3]");
		if (!fs$3.exists(ENGINEERING_DIR$1)) return error(`${ENGINEERING_DIR$1}/ directory not found. Run npx festinalente first.`);
		const docs = loadDocs(ENGINEERING_DIR$1, "engineering");
		const { results, relatedDocs } = executeSearch(docs, searchTerms, getEngineeringSearchConfig(), minScore);
		return success({
			query: searchTerms,
			count: results.length,
			docs: results,
			relatedDocs
		});
	}
	/**
	* Search hybrid command - unified search across product and engineering docs.
	*/
	function searchHybrid(args) {
		const parsed = parseArgs(args);
		const searchTerms = parsed.positional;
		const minScore = getNumberFlag(parsed.flags, "min-score") ?? DEFAULT_MIN_SCORE;
		const docTypeFilter = getStringFlag(parsed.flags, "type");
		if (searchTerms.length === 0) return error("Usage: search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]");
		let docs = [];
		if (!docTypeFilter || docTypeFilter === "product") {
			if (fs$3.exists(PRODUCT_DIR$1)) docs = docs.concat(loadDocs(PRODUCT_DIR$1, "product"));
		}
		if (!docTypeFilter || docTypeFilter === "engineering") {
			if (fs$3.exists(ENGINEERING_DIR$1)) docs = docs.concat(loadDocs(ENGINEERING_DIR$1, "engineering"));
		}
		if (docs.length === 0) return success({
			query: searchTerms,
			count: 0,
			docs: [],
			relatedDocs: []
		});
		const { results, relatedDocs } = executeSearch(docs, searchTerms, getHybridSearchConfig(), minScore);
		return success({
			query: searchTerms,
			count: results.length,
			docs: results,
			relatedDocs
		});
	}
	/**
	* Reverse lookup command - find docs that reference a given ID.
	*/
	function reverseLookup(args) {
		const parsed = parseArgs(args);
		if (parsed.positional.length === 0) return error("Usage: reverse-lookup <doc-id>");
		const targetId = parsed.positional[0];
		const productDocs = fs$3.exists(PRODUCT_DIR$1) ? loadDocs(PRODUCT_DIR$1, "product") : [];
		const engineeringDocs = fs$3.exists(ENGINEERING_DIR$1) ? loadDocs(ENGINEERING_DIR$1, "engineering") : [];
		const allDocs = [...productDocs, ...engineeringDocs];
		const referencedBy = [];
		const usedBy = [];
		for (const doc of allDocs) {
			if (doc.references.includes(targetId)) referencedBy.push({
				id: doc.id,
				tldr: doc.tldr,
				via: "references"
			});
			if (doc.uses.includes(targetId)) usedBy.push({
				id: doc.id,
				tldr: doc.tldr,
				via: "uses"
			});
		}
		return success({
			id: targetId,
			referencedBy,
			usedBy
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("search-product", "Search product docs by keywords", "search-product keyword1 keyword2 ... [--min-score=0.3]", searchProduct),
			defineCommand("search-engineering", "Search engineering docs by keywords", "search-engineering keyword1 keyword2 ... [--min-score=0.3]", searchEngineering),
			defineCommand("search-hybrid", "Hybrid search combining BM25+ scoring across all doc types", "search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]", searchHybrid),
			defineCommand("reverse-lookup", "Find docs that reference a given doc ID", "reverse-lookup <doc-id>", reverseLookup)
		];
	}
	return {
		searchProduct,
		searchEngineering,
		searchHybrid,
		reverseLookup,
		getCommands
	};
}

//#endregion
//#region src/cli/handlers/spec.handler.ts
const TASKS_DIR$2 = ".festinalente/tasks";
/**
* Create a spec handler.
*
* @param deps - The dependencies.
* @returns A SpecHandler instance.
*/
function createSpecHandler(deps) {
	const { fs: fs$3, xmlParser, taskResolver } = deps;
	/**
	* Resolve a task ID (prefix or full) to the actual folder name.
	*/
	function resolveTaskId(id) {
		if (!fs$3.exists(TASKS_DIR$2)) return null;
		const result = fs$3.listDirectories(TASKS_DIR$2);
		if (!result.ok) return null;
		return taskResolver.resolveTaskFolder(result.value, id);
	}
	/**
	* Find spec command.
	*/
	function findSpec(args) {
		if (args.length === 0) return error("Usage: find-spec <id>");
		const id = args[0];
		if (!fs$3.exists(TASKS_DIR$2)) return error(`${TASKS_DIR$2}/ directory not found. Run npx festinalente first.`);
		const resolvedId = resolveTaskId(id) ?? id;
		const specPath = fs$3.joinPath(TASKS_DIR$2, resolvedId, "spec.xml").replace(/\\/g, "/");
		if (!fs$3.exists(specPath)) return error(`No task found matching '${id}'`);
		const readResult = fs$3.readFile(specPath);
		if (!readResult.ok) return error(`Failed to read spec file: ${readResult.error.message}`);
		const parsed = xmlParser.parseSpecXml(readResult.value);
		return success({
			id: resolvedId,
			filename: "spec.xml",
			path: specPath,
			task: parsed.task || resolvedId,
			created: parsed.created,
			updated: parsed.updated
		});
	}
	/**
	* Find plan command.
	*/
	function findPlan(args) {
		if (args.length === 0) return error("Usage: find-plan <id>");
		const id = args[0];
		if (!fs$3.exists(TASKS_DIR$2)) return error(`${TASKS_DIR$2}/ directory not found. Run npx festinalente first.`);
		const resolvedId = resolveTaskId(id) ?? id;
		const planPath = fs$3.joinPath(TASKS_DIR$2, resolvedId, "plan.xml").replace(/\\/g, "/");
		if (!fs$3.exists(planPath)) return error(`No task found matching '${id}'`);
		const readResult = fs$3.readFile(planPath);
		if (!readResult.ok) return error(`Failed to read plan file: ${readResult.error.message}`);
		const parsed = xmlParser.parsePlanXml(readResult.value);
		return success({
			id: resolvedId,
			filename: "plan.xml",
			path: planPath,
			task: parsed.task || resolvedId,
			spec: parsed.spec,
			status: parsed.status,
			iteration: parsed.iteration
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [defineCommand("find-spec", "Find a spec file by task ID", "find-spec <id>", findSpec), defineCommand("find-plan", "Find a plan file by task ID", "find-plan <id>", findPlan)];
	}
	return {
		findSpec,
		findPlan,
		getCommands
	};
}

//#endregion
//#region src/cli/handlers/task.handler.ts
var import_slugify = __toESM(require_slugify(), 1);
const TASKS_DIR$1 = ".festinalente/tasks";
const MAX_SLUG_LENGTH = 50;
/**
* Create a task handler.
*
* @param deps - The dependencies.
* @returns A TaskHandler instance.
*/
function createTaskHandler(deps) {
	const { fs: fs$3, xmlParser, taskResolver } = deps;
	/**
	* Find task file by numeric prefix.
	*/
	function findTaskFile(id) {
		if (!fs$3.exists(TASKS_DIR$1)) return null;
		const result = fs$3.listDirectories(TASKS_DIR$1);
		if (!result.ok) return null;
		const folder = taskResolver.resolveTaskFolder(result.value, id);
		if (!folder) return null;
		const taskPath = fs$3.joinPath(TASKS_DIR$1, folder, "task.xml");
		if (!fs$3.exists(taskPath)) return null;
		return {
			path: taskPath.replace(/\\/g, "/"),
			folderId: folder
		};
	}
	/**
	* Find task command.
	*/
	function findTask(args) {
		if (args.length === 0) return error("Usage: find-task <id>");
		const id = args[0];
		if (!fs$3.exists(TASKS_DIR$1)) return error(`${TASKS_DIR$1}/ directory not found. Run npx festinalente first.`);
		const found = findTaskFile(id);
		if (!found) return error(`Task ${id} not found in ${TASKS_DIR$1}/`);
		const readResult = fs$3.readFile(found.path);
		if (!readResult.ok) return error(`Failed to read task file: ${readResult.error.message}`);
		const parsed = xmlParser.parseTaskXml(readResult.value);
		return success({
			id: found.folderId,
			filename: "task.xml",
			path: found.path,
			title: parsed.title,
			status: parsed.status,
			priority: parsed.priority,
			labels: parsed.labels,
			projectId: parsed.projectId ?? null
		});
	}
	/**
	* List tasks command.
	*/
	function listTasks(args) {
		const parsed = parseArgs(args);
		if (!fs$3.exists(TASKS_DIR$1)) return error(`${TASKS_DIR$1}/ directory not found. Run npx festinalente first.`);
		const dirsResult = fs$3.listDirectories(TASKS_DIR$1);
		if (!dirsResult.ok) return error(`Failed to read tasks directory: ${dirsResult.error.message}`);
		const folders = [...dirsResult.value].sort();
		const tasks = [];
		for (const folderId of folders) {
			const filePath = fs$3.joinPath(TASKS_DIR$1, folderId, "task.xml").replace(/\\/g, "/");
			if (!fs$3.exists(filePath)) continue;
			const readResult = fs$3.readFile(filePath);
			if (!readResult.ok) continue;
			const parsedTask = xmlParser.parseTaskXml(readResult.value);
			const taskProjectId = parsedTask.projectId ?? null;
			const task = {
				id: folderId,
				filename: "task.xml",
				path: filePath,
				title: parsedTask.title,
				status: parsedTask.status,
				priority: parsedTask.priority,
				labels: parsedTask.labels,
				projectId: taskProjectId
			};
			const statusFilter = getStringFlag(parsed.flags, "status");
			const excludeStatus = getStringFlag(parsed.flags, "exclude-status");
			const priorityFilter = getStringFlag(parsed.flags, "priority");
			const labelFilter = getStringFlag(parsed.flags, "label");
			const projectFilter = getStringFlag(parsed.flags, "project");
			if (statusFilter && task.status !== statusFilter) continue;
			if (excludeStatus && task.status === excludeStatus) continue;
			if (priorityFilter && task.priority !== priorityFilter) continue;
			if (labelFilter && !task.labels.includes(labelFilter)) continue;
			if (projectFilter && task.projectId !== projectFilter) continue;
			tasks.push(task);
		}
		return success({
			count: tasks.length,
			tasks
		});
	}
	/**
	* Delete task command.
	*/
	function deleteTask(args) {
		if (args.length === 0) return error("Usage: delete-task <id>");
		const id = args[0];
		if (!fs$3.exists(TASKS_DIR$1)) return error(`${TASKS_DIR$1}/ directory not found. Run npx festinalente first.`);
		const found = findTaskFile(id);
		if (!found) return error(`No task found matching prefix ${id}`);
		const readResult = fs$3.readFile(found.path);
		if (!readResult.ok) return error(`Failed to read task file: ${readResult.error.message}`);
		const parsed = xmlParser.parseTaskXml(readResult.value);
		if (parsed.status !== "backlog") return error(`Cannot delete task in ${parsed.status} status. Only backlog allowed.`);
		return success({
			success: true,
			id: found.folderId,
			title: parsed.title,
			path: found.path
		});
	}
	/**
	* Next ID command.
	*/
	function nextId(args) {
		const parsed = parseArgs(args);
		const title = getStringFlag(parsed.flags, "title");
		if (!title) return error("Usage: next-id --title=\"Task title\"");
		const padding = 3;
		const slug = (0, import_slugify.default)(title, {
			lower: true,
			strict: true
		}).slice(0, MAX_SLUG_LENGTH);
		if (!fs$3.exists(TASKS_DIR$1)) {
			const paddedNumber$1 = "1".padStart(padding, "0");
			return success({
				nextId: `${paddedNumber$1}-${slug}`,
				currentHighest: null,
				slug
			});
		}
		const dirsResult = fs$3.listDirectories(TASKS_DIR$1);
		if (!dirsResult.ok || dirsResult.value.length === 0) {
			const paddedNumber$1 = "1".padStart(padding, "0");
			return success({
				nextId: `${paddedNumber$1}-${slug}`,
				currentHighest: null,
				slug
			});
		}
		let highest = 0;
		for (const folderName of dirsResult.value) {
			const match = folderName.match(/^(\d+)/);
			if (match) {
				const id = parseInt(match[1], 10);
				if (!isNaN(id) && id > highest) highest = id;
			}
		}
		const paddedNumber = (highest + 1).toString().padStart(padding, "0");
		const currentHighest = highest.toString().padStart(padding, "0");
		return success({
			nextId: `${paddedNumber}-${slug}`,
			currentHighest,
			slug
		});
	}
	/**
	* Get a single task from plan.xml by task ID.
	*
	* @param args - Command arguments: [festina-task-id, plan-task-id].
	* @returns The plan task details or an error.
	*/
	function getPlanTask(args) {
		if (args.length < 2) return error("Usage: get-plan-task <festina-task-id> <plan-task-id>");
		const festinaTaskId = args[0];
		const planTaskId = args[1];
		if (!fs$3.exists(TASKS_DIR$1)) return error(`${TASKS_DIR$1}/ directory not found. Run npx festinalente first.`);
		const found = findTaskFile(festinaTaskId);
		if (!found) return error(`Task ${festinaTaskId} not found in ${TASKS_DIR$1}/`);
		const planPath = fs$3.joinPath(TASKS_DIR$1, found.folderId, "plan.xml").replace(/\\/g, "/");
		if (!fs$3.exists(planPath)) return error(`Plan file not found at ${planPath}`);
		const readResult = fs$3.readFile(planPath);
		if (!readResult.ok) return error(`Failed to read plan file: ${readResult.error.message}`);
		const parsed = xmlParser.parsePlanTask(readResult.value, planTaskId);
		if (!parsed) return error(`Task ${planTaskId} not found in plan.xml`);
		return success({
			taskId: parsed.taskId,
			name: parsed.name,
			files: parsed.files,
			requirements: parsed.requirements,
			pattern: parsed.pattern,
			context: parsed.context,
			action: parsed.action,
			verify: parsed.verify,
			done: parsed.done,
			completed: parsed.completed
		});
	}
	/**
	* Get the context files for a task from plan.xml.
	*
	* @param args - Command arguments: [festina-task-id, plan-task-id].
	* @returns The context file paths or an error.
	*/
	function getPlanTaskContext(args) {
		if (args.length < 2) return error("Usage: get-plan-task-context <festina-task-id> <plan-task-id>");
		const festinaTaskId = args[0];
		const planTaskId = args[1];
		if (!fs$3.exists(TASKS_DIR$1)) return error(`${TASKS_DIR$1}/ directory not found. Run npx festinalente first.`);
		const found = findTaskFile(festinaTaskId);
		if (!found) return error(`Task ${festinaTaskId} not found in ${TASKS_DIR$1}/`);
		const planPath = fs$3.joinPath(TASKS_DIR$1, found.folderId, "plan.xml").replace(/\\/g, "/");
		if (!fs$3.exists(planPath)) return error(`Plan file not found at ${planPath}`);
		const readResult = fs$3.readFile(planPath);
		if (!readResult.ok) return error(`Failed to read plan file: ${readResult.error.message}`);
		const parsed = xmlParser.parsePlanTaskContext(readResult.value, planTaskId);
		if (!parsed) return error(`Task ${planTaskId} not found in plan.xml`);
		return success({
			taskId: parsed.taskId,
			files: parsed.files
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("find-task", "Find a task by ID", "find-task <id>", findTask),
			defineCommand("list-tasks", "List all tasks with optional filtering", "list-tasks [--status=X] [--exclude-status=X] [--label=X] [--priority=X] [--project=X]", listTasks),
			defineCommand("delete-task", "Delete a task (backlog status only)", "delete-task <id>", deleteTask),
			defineCommand("next-id", "Get the next available task ID", "next-id --title=\"Task title\"", nextId),
			defineCommand("get-plan-task", "Get a single task from plan.xml by task ID", "get-plan-task <festina-task-id> <plan-task-id>", getPlanTask),
			defineCommand("get-plan-task-context", "Get context files for a task from plan.xml", "get-plan-task-context <festina-task-id> <plan-task-id>", getPlanTaskContext)
		];
	}
	return {
		findTask,
		listTasks,
		deleteTask,
		nextId,
		getPlanTask,
		getPlanTaskContext,
		getCommands
	};
}

//#endregion
//#region src/cli/computers/task-resolver.computer.ts
/**
* Create a task resolver computer.
*
* @returns A TaskResolverComputer instance.
*/
function createTaskResolverComputer() {
	function resolveTaskFolder(folders, id) {
		if (folders.includes(id)) return id;
		if (/^\d+$/.test(id)) for (const folder of folders) {
			const folderMatch = folder.match(/^(\d+)/);
			if (folderMatch && folderMatch[1] === id) return folder;
		}
		return null;
	}
	return { resolveTaskFolder };
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/util.js
const nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
const nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
const nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
const regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
	const matches = [];
	let match = regex.exec(string);
	while (match) {
		const allmatches = [];
		allmatches.startIndex = regex.lastIndex - match[0].length;
		const len = match.length;
		for (let index = 0; index < len; index++) allmatches.push(match[index]);
		matches.push(allmatches);
		match = regex.exec(string);
	}
	return matches;
}
const isName = function(string) {
	const match = regexName.exec(string);
	return !(match === null || typeof match === "undefined");
};
function isExist(v) {
	return typeof v !== "undefined";
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/validator.js
const defaultOptions$1 = {
	allowBooleanAttributes: false,
	unpairedTags: []
};
function validate(xmlData, options) {
	options = Object.assign({}, defaultOptions$1, options);
	const tags = [];
	let tagFound = false;
	let reachedRoot = false;
	if (xmlData[0] === "﻿") xmlData = xmlData.substr(1);
	for (let i$2 = 0; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "<" && xmlData[i$2 + 1] === "?") {
		i$2 += 2;
		i$2 = readPI(xmlData, i$2);
		if (i$2.err) return i$2;
	} else if (xmlData[i$2] === "<") {
		let tagStartPos = i$2;
		i$2++;
		if (xmlData[i$2] === "!") {
			i$2 = readCommentAndCDATA(xmlData, i$2);
			continue;
		} else {
			let closingTag = false;
			if (xmlData[i$2] === "/") {
				closingTag = true;
				i$2++;
			}
			let tagName = "";
			for (; i$2 < xmlData.length && xmlData[i$2] !== ">" && xmlData[i$2] !== " " && xmlData[i$2] !== "	" && xmlData[i$2] !== "\n" && xmlData[i$2] !== "\r"; i$2++) tagName += xmlData[i$2];
			tagName = tagName.trim();
			if (tagName[tagName.length - 1] === "/") {
				tagName = tagName.substring(0, tagName.length - 1);
				i$2--;
			}
			if (!validateTagName(tagName)) {
				let msg;
				if (tagName.trim().length === 0) msg = "Invalid space after '<'.";
				else msg = "Tag '" + tagName + "' is an invalid name.";
				return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i$2));
			}
			const result = readAttributeStr(xmlData, i$2);
			if (result === false) return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i$2));
			let attrStr = result.value;
			i$2 = result.index;
			if (attrStr[attrStr.length - 1] === "/") {
				const attrStrStart = i$2 - attrStr.length;
				attrStr = attrStr.substring(0, attrStr.length - 1);
				const isValid$1 = validateAttributeString(attrStr, options);
				if (isValid$1 === true) tagFound = true;
				else return getErrorObject(isValid$1.err.code, isValid$1.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid$1.err.line));
			} else if (closingTag) if (!result.tagClosed) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i$2));
			else if (attrStr.trim().length > 0) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
			else if (tags.length === 0) return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
			else {
				const otg = tags.pop();
				if (tagName !== otg.tagName) {
					let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
					return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
				}
				if (tags.length == 0) reachedRoot = true;
			}
			else {
				const isValid$1 = validateAttributeString(attrStr, options);
				if (isValid$1 !== true) return getErrorObject(isValid$1.err.code, isValid$1.err.msg, getLineNumberForPosition(xmlData, i$2 - attrStr.length + isValid$1.err.line));
				if (reachedRoot === true) return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i$2));
				else if (options.unpairedTags.indexOf(tagName) !== -1) {} else tags.push({
					tagName,
					tagStartPos
				});
				tagFound = true;
			}
			for (i$2++; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "<") if (xmlData[i$2 + 1] === "!") {
				i$2++;
				i$2 = readCommentAndCDATA(xmlData, i$2);
				continue;
			} else if (xmlData[i$2 + 1] === "?") {
				i$2 = readPI(xmlData, ++i$2);
				if (i$2.err) return i$2;
			} else break;
			else if (xmlData[i$2] === "&") {
				const afterAmp = validateAmpersand(xmlData, i$2);
				if (afterAmp == -1) return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i$2));
				i$2 = afterAmp;
			} else if (reachedRoot === true && !isWhiteSpace(xmlData[i$2])) return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i$2));
			if (xmlData[i$2] === "<") i$2--;
		}
	} else {
		if (isWhiteSpace(xmlData[i$2])) continue;
		return getErrorObject("InvalidChar", "char '" + xmlData[i$2] + "' is not expected.", getLineNumberForPosition(xmlData, i$2));
	}
	if (!tagFound) return getErrorObject("InvalidXml", "Start tag expected.", 1);
	else if (tags.length == 1) return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
	else if (tags.length > 0) return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", {
		line: 1,
		col: 1
	});
	return true;
}
function isWhiteSpace(char) {
	return char === " " || char === "	" || char === "\n" || char === "\r";
}
/**
* Read Processing insstructions and skip
* @param {*} xmlData
* @param {*} i
*/
function readPI(xmlData, i$2) {
	const start = i$2;
	for (; i$2 < xmlData.length; i$2++) if (xmlData[i$2] == "?" || xmlData[i$2] == " ") {
		const tagname = xmlData.substr(start, i$2 - start);
		if (i$2 > 5 && tagname === "xml") return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i$2));
		else if (xmlData[i$2] == "?" && xmlData[i$2 + 1] == ">") {
			i$2++;
			break;
		} else continue;
	}
	return i$2;
}
function readCommentAndCDATA(xmlData, i$2) {
	if (xmlData.length > i$2 + 5 && xmlData[i$2 + 1] === "-" && xmlData[i$2 + 2] === "-") {
		for (i$2 += 3; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "-" && xmlData[i$2 + 1] === "-" && xmlData[i$2 + 2] === ">") {
			i$2 += 2;
			break;
		}
	} else if (xmlData.length > i$2 + 8 && xmlData[i$2 + 1] === "D" && xmlData[i$2 + 2] === "O" && xmlData[i$2 + 3] === "C" && xmlData[i$2 + 4] === "T" && xmlData[i$2 + 5] === "Y" && xmlData[i$2 + 6] === "P" && xmlData[i$2 + 7] === "E") {
		let angleBracketsCount = 1;
		for (i$2 += 8; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "<") angleBracketsCount++;
		else if (xmlData[i$2] === ">") {
			angleBracketsCount--;
			if (angleBracketsCount === 0) break;
		}
	} else if (xmlData.length > i$2 + 9 && xmlData[i$2 + 1] === "[" && xmlData[i$2 + 2] === "C" && xmlData[i$2 + 3] === "D" && xmlData[i$2 + 4] === "A" && xmlData[i$2 + 5] === "T" && xmlData[i$2 + 6] === "A" && xmlData[i$2 + 7] === "[") {
		for (i$2 += 8; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "]" && xmlData[i$2 + 1] === "]" && xmlData[i$2 + 2] === ">") {
			i$2 += 2;
			break;
		}
	}
	return i$2;
}
const doubleQuote = "\"";
const singleQuote = "'";
/**
* Keep reading xmlData until '<' is found outside the attribute value.
* @param {string} xmlData
* @param {number} i
*/
function readAttributeStr(xmlData, i$2) {
	let attrStr = "";
	let startChar = "";
	let tagClosed = false;
	for (; i$2 < xmlData.length; i$2++) {
		if (xmlData[i$2] === doubleQuote || xmlData[i$2] === singleQuote) if (startChar === "") startChar = xmlData[i$2];
		else if (startChar !== xmlData[i$2]) {} else startChar = "";
		else if (xmlData[i$2] === ">") {
			if (startChar === "") {
				tagClosed = true;
				break;
			}
		}
		attrStr += xmlData[i$2];
	}
	if (startChar !== "") return false;
	return {
		value: attrStr,
		index: i$2,
		tagClosed
	};
}
/**
* Select all the attributes whether valid or invalid.
*/
const validAttrStrRegxp = new RegExp("(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['\"])(([\\s\\S])*?)\\5)?", "g");
function validateAttributeString(attrStr, options) {
	const matches = getAllMatches(attrStr, validAttrStrRegxp);
	const attrNames = {};
	for (let i$2 = 0; i$2 < matches.length; i$2++) {
		if (matches[i$2][1].length === 0) return getErrorObject("InvalidAttr", "Attribute '" + matches[i$2][2] + "' has no space in starting.", getPositionFromMatch(matches[i$2]));
		else if (matches[i$2][3] !== void 0 && matches[i$2][4] === void 0) return getErrorObject("InvalidAttr", "Attribute '" + matches[i$2][2] + "' is without value.", getPositionFromMatch(matches[i$2]));
		else if (matches[i$2][3] === void 0 && !options.allowBooleanAttributes) return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i$2][2] + "' is not allowed.", getPositionFromMatch(matches[i$2]));
		const attrName = matches[i$2][2];
		if (!validateAttrName(attrName)) return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i$2]));
		if (!attrNames.hasOwnProperty(attrName)) attrNames[attrName] = 1;
		else return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i$2]));
	}
	return true;
}
function validateNumberAmpersand(xmlData, i$2) {
	let re = /\d/;
	if (xmlData[i$2] === "x") {
		i$2++;
		re = /[\da-fA-F]/;
	}
	for (; i$2 < xmlData.length; i$2++) {
		if (xmlData[i$2] === ";") return i$2;
		if (!xmlData[i$2].match(re)) break;
	}
	return -1;
}
function validateAmpersand(xmlData, i$2) {
	i$2++;
	if (xmlData[i$2] === ";") return -1;
	if (xmlData[i$2] === "#") {
		i$2++;
		return validateNumberAmpersand(xmlData, i$2);
	}
	let count = 0;
	for (; i$2 < xmlData.length; i$2++, count++) {
		if (xmlData[i$2].match(/\w/) && count < 20) continue;
		if (xmlData[i$2] === ";") break;
		return -1;
	}
	return i$2;
}
function getErrorObject(code, message, lineNumber) {
	return { err: {
		code,
		msg: message,
		line: lineNumber.line || lineNumber,
		col: lineNumber.col
	} };
}
function validateAttrName(attrName) {
	return isName(attrName);
}
function validateTagName(tagname) {
	return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
	const lines = xmlData.substring(0, index).split(/\r?\n/);
	return {
		line: lines.length,
		col: lines[lines.length - 1].length + 1
	};
}
function getPositionFromMatch(match) {
	return match.startIndex + match[1].length;
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
const defaultOptions = {
	preserveOrder: false,
	attributeNamePrefix: "@_",
	attributesGroupName: false,
	textNodeName: "#text",
	ignoreAttributes: true,
	removeNSPrefix: false,
	allowBooleanAttributes: false,
	parseTagValue: true,
	parseAttributeValue: false,
	trimValues: true,
	cdataPropName: false,
	numberParseOptions: {
		hex: true,
		leadingZeros: true,
		eNotation: true
	},
	tagValueProcessor: function(tagName, val) {
		return val;
	},
	attributeValueProcessor: function(attrName, val) {
		return val;
	},
	stopNodes: [],
	alwaysCreateTextNode: false,
	isArray: () => false,
	commentPropName: false,
	unpairedTags: [],
	processEntities: true,
	htmlEntities: false,
	ignoreDeclaration: false,
	ignorePiTags: false,
	transformTagName: false,
	transformAttributeName: false,
	updateTag: function(tagName, jPath, attrs) {
		return tagName;
	},
	captureMetaData: false
};
/**
* Normalizes processEntities option for backward compatibility
* @param {boolean|object} value 
* @returns {object} Always returns normalized object
*/
function normalizeProcessEntities(value) {
	if (typeof value === "boolean") return {
		enabled: value,
		maxEntitySize: 1e4,
		maxExpansionDepth: 10,
		maxTotalExpansions: 1e3,
		maxExpandedLength: 1e5,
		allowedTags: null,
		tagFilter: null
	};
	if (typeof value === "object" && value !== null) return {
		enabled: value.enabled !== false,
		maxEntitySize: value.maxEntitySize ?? 1e4,
		maxExpansionDepth: value.maxExpansionDepth ?? 10,
		maxTotalExpansions: value.maxTotalExpansions ?? 1e3,
		maxExpandedLength: value.maxExpandedLength ?? 1e5,
		allowedTags: value.allowedTags ?? null,
		tagFilter: value.tagFilter ?? null
	};
	return normalizeProcessEntities(true);
}
const buildOptions = function(options) {
	const built = Object.assign({}, defaultOptions, options);
	built.processEntities = normalizeProcessEntities(built.processEntities);
	return built;
};

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
let METADATA_SYMBOL$1;
if (typeof Symbol !== "function") METADATA_SYMBOL$1 = "@@xmlMetadata";
else METADATA_SYMBOL$1 = Symbol("XML Node Metadata");
var XmlNode = class {
	constructor(tagname) {
		this.tagname = tagname;
		this.child = [];
		this[":@"] = {};
	}
	add(key, val) {
		if (key === "__proto__") key = "#__proto__";
		this.child.push({ [key]: val });
	}
	addChild(node, startIndex) {
		if (node.tagname === "__proto__") node.tagname = "#__proto__";
		if (node[":@"] && Object.keys(node[":@"]).length > 0) this.child.push({
			[node.tagname]: node.child,
			[":@"]: node[":@"]
		});
		else this.child.push({ [node.tagname]: node.child });
		if (startIndex !== void 0) this.child[this.child.length - 1][METADATA_SYMBOL$1] = { startIndex };
	}
	/** symbol used for metadata */
	static getMetaDataSymbol() {
		return METADATA_SYMBOL$1;
	}
};

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var DocTypeReader = class {
	constructor(options) {
		this.suppressValidationErr = !options;
		this.options = options;
	}
	readDocType(xmlData, i$2) {
		const entities = {};
		if (xmlData[i$2 + 3] === "O" && xmlData[i$2 + 4] === "C" && xmlData[i$2 + 5] === "T" && xmlData[i$2 + 6] === "Y" && xmlData[i$2 + 7] === "P" && xmlData[i$2 + 8] === "E") {
			i$2 = i$2 + 9;
			let angleBracketsCount = 1;
			let hasBody = false, comment = false;
			let exp = "";
			for (; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "<" && !comment) {
				if (hasBody && hasSeq(xmlData, "!ENTITY", i$2)) {
					i$2 += 7;
					let entityName, val;
					[entityName, val, i$2] = this.readEntityExp(xmlData, i$2 + 1, this.suppressValidationErr);
					if (val.indexOf("&") === -1) {
						const escaped = entityName.replace(/[.\-+*:]/g, "\\.");
						entities[entityName] = {
							regx: RegExp(`&${escaped};`, "g"),
							val
						};
					}
				} else if (hasBody && hasSeq(xmlData, "!ELEMENT", i$2)) {
					i$2 += 8;
					const { index } = this.readElementExp(xmlData, i$2 + 1);
					i$2 = index;
				} else if (hasBody && hasSeq(xmlData, "!ATTLIST", i$2)) i$2 += 8;
				else if (hasBody && hasSeq(xmlData, "!NOTATION", i$2)) {
					i$2 += 9;
					const { index } = this.readNotationExp(xmlData, i$2 + 1, this.suppressValidationErr);
					i$2 = index;
				} else if (hasSeq(xmlData, "!--", i$2)) comment = true;
				else throw new Error(`Invalid DOCTYPE`);
				angleBracketsCount++;
				exp = "";
			} else if (xmlData[i$2] === ">") {
				if (comment) {
					if (xmlData[i$2 - 1] === "-" && xmlData[i$2 - 2] === "-") {
						comment = false;
						angleBracketsCount--;
					}
				} else angleBracketsCount--;
				if (angleBracketsCount === 0) break;
			} else if (xmlData[i$2] === "[") hasBody = true;
			else exp += xmlData[i$2];
			if (angleBracketsCount !== 0) throw new Error(`Unclosed DOCTYPE`);
		} else throw new Error(`Invalid Tag instead of DOCTYPE`);
		return {
			entities,
			i: i$2
		};
	}
	readEntityExp(xmlData, i$2) {
		i$2 = skipWhitespace(xmlData, i$2);
		let entityName = "";
		while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2]) && xmlData[i$2] !== "\"" && xmlData[i$2] !== "'") {
			entityName += xmlData[i$2];
			i$2++;
		}
		validateEntityName(entityName);
		i$2 = skipWhitespace(xmlData, i$2);
		if (!this.suppressValidationErr) {
			if (xmlData.substring(i$2, i$2 + 6).toUpperCase() === "SYSTEM") throw new Error("External entities are not supported");
			else if (xmlData[i$2] === "%") throw new Error("Parameter entities are not supported");
		}
		let entityValue = "";
		[i$2, entityValue] = this.readIdentifierVal(xmlData, i$2, "entity");
		if (this.options.enabled !== false && this.options.maxEntitySize && entityValue.length > this.options.maxEntitySize) throw new Error(`Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`);
		i$2--;
		return [
			entityName,
			entityValue,
			i$2
		];
	}
	readNotationExp(xmlData, i$2) {
		i$2 = skipWhitespace(xmlData, i$2);
		let notationName = "";
		while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2])) {
			notationName += xmlData[i$2];
			i$2++;
		}
		!this.suppressValidationErr && validateEntityName(notationName);
		i$2 = skipWhitespace(xmlData, i$2);
		const identifierType = xmlData.substring(i$2, i$2 + 6).toUpperCase();
		if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
		i$2 += identifierType.length;
		i$2 = skipWhitespace(xmlData, i$2);
		let publicIdentifier = null;
		let systemIdentifier = null;
		if (identifierType === "PUBLIC") {
			[i$2, publicIdentifier] = this.readIdentifierVal(xmlData, i$2, "publicIdentifier");
			i$2 = skipWhitespace(xmlData, i$2);
			if (xmlData[i$2] === "\"" || xmlData[i$2] === "'") [i$2, systemIdentifier] = this.readIdentifierVal(xmlData, i$2, "systemIdentifier");
		} else if (identifierType === "SYSTEM") {
			[i$2, systemIdentifier] = this.readIdentifierVal(xmlData, i$2, "systemIdentifier");
			if (!this.suppressValidationErr && !systemIdentifier) throw new Error("Missing mandatory system identifier for SYSTEM notation");
		}
		return {
			notationName,
			publicIdentifier,
			systemIdentifier,
			index: --i$2
		};
	}
	readIdentifierVal(xmlData, i$2, type$1) {
		let identifierVal = "";
		const startChar = xmlData[i$2];
		if (startChar !== "\"" && startChar !== "'") throw new Error(`Expected quoted string, found "${startChar}"`);
		i$2++;
		while (i$2 < xmlData.length && xmlData[i$2] !== startChar) {
			identifierVal += xmlData[i$2];
			i$2++;
		}
		if (xmlData[i$2] !== startChar) throw new Error(`Unterminated ${type$1} value`);
		i$2++;
		return [i$2, identifierVal];
	}
	readElementExp(xmlData, i$2) {
		i$2 = skipWhitespace(xmlData, i$2);
		let elementName = "";
		while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2])) {
			elementName += xmlData[i$2];
			i$2++;
		}
		if (!this.suppressValidationErr && !isName(elementName)) throw new Error(`Invalid element name: "${elementName}"`);
		i$2 = skipWhitespace(xmlData, i$2);
		let contentModel = "";
		if (xmlData[i$2] === "E" && hasSeq(xmlData, "MPTY", i$2)) i$2 += 4;
		else if (xmlData[i$2] === "A" && hasSeq(xmlData, "NY", i$2)) i$2 += 2;
		else if (xmlData[i$2] === "(") {
			i$2++;
			while (i$2 < xmlData.length && xmlData[i$2] !== ")") {
				contentModel += xmlData[i$2];
				i$2++;
			}
			if (xmlData[i$2] !== ")") throw new Error("Unterminated content model");
		} else if (!this.suppressValidationErr) throw new Error(`Invalid Element Expression, found "${xmlData[i$2]}"`);
		return {
			elementName,
			contentModel: contentModel.trim(),
			index: i$2
		};
	}
	readAttlistExp(xmlData, i$2) {
		i$2 = skipWhitespace(xmlData, i$2);
		let elementName = "";
		while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2])) {
			elementName += xmlData[i$2];
			i$2++;
		}
		validateEntityName(elementName);
		i$2 = skipWhitespace(xmlData, i$2);
		let attributeName = "";
		while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2])) {
			attributeName += xmlData[i$2];
			i$2++;
		}
		if (!validateEntityName(attributeName)) throw new Error(`Invalid attribute name: "${attributeName}"`);
		i$2 = skipWhitespace(xmlData, i$2);
		let attributeType = "";
		if (xmlData.substring(i$2, i$2 + 8).toUpperCase() === "NOTATION") {
			attributeType = "NOTATION";
			i$2 += 8;
			i$2 = skipWhitespace(xmlData, i$2);
			if (xmlData[i$2] !== "(") throw new Error(`Expected '(', found "${xmlData[i$2]}"`);
			i$2++;
			let allowedNotations = [];
			while (i$2 < xmlData.length && xmlData[i$2] !== ")") {
				let notation = "";
				while (i$2 < xmlData.length && xmlData[i$2] !== "|" && xmlData[i$2] !== ")") {
					notation += xmlData[i$2];
					i$2++;
				}
				notation = notation.trim();
				if (!validateEntityName(notation)) throw new Error(`Invalid notation name: "${notation}"`);
				allowedNotations.push(notation);
				if (xmlData[i$2] === "|") {
					i$2++;
					i$2 = skipWhitespace(xmlData, i$2);
				}
			}
			if (xmlData[i$2] !== ")") throw new Error("Unterminated list of notations");
			i$2++;
			attributeType += " (" + allowedNotations.join("|") + ")";
		} else {
			while (i$2 < xmlData.length && !/\s/.test(xmlData[i$2])) {
				attributeType += xmlData[i$2];
				i$2++;
			}
			const validTypes = [
				"CDATA",
				"ID",
				"IDREF",
				"IDREFS",
				"ENTITY",
				"ENTITIES",
				"NMTOKEN",
				"NMTOKENS"
			];
			if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) throw new Error(`Invalid attribute type: "${attributeType}"`);
		}
		i$2 = skipWhitespace(xmlData, i$2);
		let defaultValue = "";
		if (xmlData.substring(i$2, i$2 + 8).toUpperCase() === "#REQUIRED") {
			defaultValue = "#REQUIRED";
			i$2 += 8;
		} else if (xmlData.substring(i$2, i$2 + 7).toUpperCase() === "#IMPLIED") {
			defaultValue = "#IMPLIED";
			i$2 += 7;
		} else [i$2, defaultValue] = this.readIdentifierVal(xmlData, i$2, "ATTLIST");
		return {
			elementName,
			attributeName,
			attributeType,
			defaultValue,
			index: i$2
		};
	}
};
const skipWhitespace = (data, index) => {
	while (index < data.length && /\s/.test(data[index])) index++;
	return index;
};
function hasSeq(data, seq$1, i$2) {
	for (let j = 0; j < seq$1.length; j++) if (seq$1[j] !== data[i$2 + j + 1]) return false;
	return true;
}
function validateEntityName(name) {
	if (isName(name)) return name;
	else throw new Error(`Invalid entity name ${name}`);
}

//#endregion
//#region ../../node_modules/.pnpm/strnum@2.1.2/node_modules/strnum/strnum.js
const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
const consider = {
	hex: true,
	leadingZeros: true,
	decimalPoint: ".",
	eNotation: true
};
function toNumber(str$1, options = {}) {
	options = Object.assign({}, consider, options);
	if (!str$1 || typeof str$1 !== "string") return str$1;
	let trimmedStr = str$1.trim();
	if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str$1;
	else if (str$1 === "0") return 0;
	else if (options.hex && hexRegex.test(trimmedStr)) return parse_int(trimmedStr, 16);
	else if (trimmedStr.includes("e") || trimmedStr.includes("E")) return resolveEnotation(str$1, trimmedStr, options);
	else {
		const match = numRegex.exec(trimmedStr);
		if (match) {
			const sign = match[1] || "";
			const leadingZeros = match[2];
			let numTrimmedByZeros = trimZeros(match[3]);
			const decimalAdjacentToLeadingZeros = sign ? str$1[leadingZeros.length + 1] === "." : str$1[leadingZeros.length] === ".";
			if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) return str$1;
			else {
				const num = Number(trimmedStr);
				const parsedStr = String(num);
				if (num === 0) return num;
				if (parsedStr.search(/[eE]/) !== -1) if (options.eNotation) return num;
				else return str$1;
				else if (trimmedStr.indexOf(".") !== -1) if (parsedStr === "0") return num;
				else if (parsedStr === numTrimmedByZeros) return num;
				else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
				else return str$1;
				let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
				if (leadingZeros) return n === parsedStr || sign + n === parsedStr ? num : str$1;
				else return n === parsedStr || n === sign + parsedStr ? num : str$1;
			}
		} else return str$1;
	}
}
const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str$1, trimmedStr, options) {
	if (!options.eNotation) return str$1;
	const notation = trimmedStr.match(eNotationRegx);
	if (notation) {
		let sign = notation[1] || "";
		const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
		const leadingZeros = notation[2];
		const eAdjacentToLeadingZeros = sign ? str$1[leadingZeros.length + 1] === eChar : str$1[leadingZeros.length] === eChar;
		if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str$1;
		else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) return Number(trimmedStr);
		else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
			trimmedStr = (notation[1] || "") + notation[3];
			return Number(trimmedStr);
		} else return str$1;
	} else return str$1;
}
/**
* 
* @param {string} numStr without leading zeros
* @returns 
*/
function trimZeros(numStr) {
	if (numStr && numStr.indexOf(".") !== -1) {
		numStr = numStr.replace(/0+$/, "");
		if (numStr === ".") numStr = "0";
		else if (numStr[0] === ".") numStr = "0" + numStr;
		else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
		return numStr;
	}
	return numStr;
}
function parse_int(numStr, base) {
	if (parseInt) return parseInt(numStr, base);
	else if (Number.parseInt) return Number.parseInt(numStr, base);
	else if (window && window.parseInt) return window.parseInt(numStr, base);
	else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
	if (typeof ignoreAttributes === "function") return ignoreAttributes;
	if (Array.isArray(ignoreAttributes)) return (attrName) => {
		for (const pattern of ignoreAttributes) {
			if (typeof pattern === "string" && attrName === pattern) return true;
			if (pattern instanceof RegExp && pattern.test(attrName)) return true;
		}
	};
	return () => false;
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var OrderedObjParser = class {
	constructor(options) {
		this.options = options;
		this.currentNode = null;
		this.tagsNodeStack = [];
		this.docTypeEntities = {};
		this.lastEntities = {
			"apos": {
				regex: /&(apos|#39|#x27);/g,
				val: "'"
			},
			"gt": {
				regex: /&(gt|#62|#x3E);/g,
				val: ">"
			},
			"lt": {
				regex: /&(lt|#60|#x3C);/g,
				val: "<"
			},
			"quot": {
				regex: /&(quot|#34|#x22);/g,
				val: "\""
			}
		};
		this.ampEntity = {
			regex: /&(amp|#38|#x26);/g,
			val: "&"
		};
		this.htmlEntities = {
			"space": {
				regex: /&(nbsp|#160);/g,
				val: " "
			},
			"cent": {
				regex: /&(cent|#162);/g,
				val: "¢"
			},
			"pound": {
				regex: /&(pound|#163);/g,
				val: "£"
			},
			"yen": {
				regex: /&(yen|#165);/g,
				val: "¥"
			},
			"euro": {
				regex: /&(euro|#8364);/g,
				val: "€"
			},
			"copyright": {
				regex: /&(copy|#169);/g,
				val: "©"
			},
			"reg": {
				regex: /&(reg|#174);/g,
				val: "®"
			},
			"inr": {
				regex: /&(inr|#8377);/g,
				val: "₹"
			},
			"num_dec": {
				regex: /&#([0-9]{1,7});/g,
				val: (_, str$1) => fromCodePoint(str$1, 10, "&#")
			},
			"num_hex": {
				regex: /&#x([0-9a-fA-F]{1,6});/g,
				val: (_, str$1) => fromCodePoint(str$1, 16, "&#x")
			}
		};
		this.addExternalEntities = addExternalEntities;
		this.parseXml = parseXml;
		this.parseTextData = parseTextData;
		this.resolveNameSpace = resolveNameSpace;
		this.buildAttributesMap = buildAttributesMap;
		this.isItStopNode = isItStopNode;
		this.replaceEntitiesValue = replaceEntitiesValue;
		this.readStopNodeData = readStopNodeData;
		this.saveTextToParentTag = saveTextToParentTag;
		this.addChild = addChild;
		this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
		this.entityExpansionCount = 0;
		this.currentExpandedLength = 0;
		if (this.options.stopNodes && this.options.stopNodes.length > 0) {
			this.stopNodesExact = new Set();
			this.stopNodesWildcard = new Set();
			for (let i$2 = 0; i$2 < this.options.stopNodes.length; i$2++) {
				const stopNodeExp = this.options.stopNodes[i$2];
				if (typeof stopNodeExp !== "string") continue;
				if (stopNodeExp.startsWith("*.")) this.stopNodesWildcard.add(stopNodeExp.substring(2));
				else this.stopNodesExact.add(stopNodeExp);
			}
		}
	}
};
function addExternalEntities(externalEntities) {
	const entKeys = Object.keys(externalEntities);
	for (let i$2 = 0; i$2 < entKeys.length; i$2++) {
		const ent = entKeys[i$2];
		const escaped = ent.replace(/[.\-+*:]/g, "\\.");
		this.lastEntities[ent] = {
			regex: new RegExp("&" + escaped + ";", "g"),
			val: externalEntities[ent]
		};
	}
}
/**
* @param {string} val
* @param {string} tagName
* @param {string} jPath
* @param {boolean} dontTrim
* @param {boolean} hasAttributes
* @param {boolean} isLeafNode
* @param {boolean} escapeEntities
*/
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
	if (val !== void 0) {
		if (this.options.trimValues && !dontTrim) val = val.trim();
		if (val.length > 0) {
			if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
			const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
			if (newval === null || newval === void 0) return val;
			else if (typeof newval !== typeof val || newval !== val) return newval;
			else if (this.options.trimValues) return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
			else {
				const trimmedVal = val.trim();
				if (trimmedVal === val) return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
				else return val;
			}
		}
	}
}
function resolveNameSpace(tagname) {
	if (this.options.removeNSPrefix) {
		const tags = tagname.split(":");
		const prefix = tagname.charAt(0) === "/" ? "/" : "";
		if (tags[0] === "xmlns") return "";
		if (tags.length === 2) tagname = prefix + tags[1];
	}
	return tagname;
}
const attrsRegx = new RegExp("([^\\s=]+)\\s*(=\\s*(['\"])([\\s\\S]*?)\\3)?", "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
	if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
		const matches = getAllMatches(attrStr, attrsRegx);
		const len = matches.length;
		const attrs = {};
		for (let i$2 = 0; i$2 < len; i$2++) {
			const attrName = this.resolveNameSpace(matches[i$2][1]);
			if (this.ignoreAttributesFn(attrName, jPath)) continue;
			let oldVal = matches[i$2][4];
			let aName = this.options.attributeNamePrefix + attrName;
			if (attrName.length) {
				if (this.options.transformAttributeName) aName = this.options.transformAttributeName(aName);
				if (aName === "__proto__") aName = "#__proto__";
				if (oldVal !== void 0) {
					if (this.options.trimValues) oldVal = oldVal.trim();
					oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
					const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
					if (newVal === null || newVal === void 0) attrs[aName] = oldVal;
					else if (typeof newVal !== typeof oldVal || newVal !== oldVal) attrs[aName] = newVal;
					else attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
				} else if (this.options.allowBooleanAttributes) attrs[aName] = true;
			}
		}
		if (!Object.keys(attrs).length) return;
		if (this.options.attributesGroupName) {
			const attrCollection = {};
			attrCollection[this.options.attributesGroupName] = attrs;
			return attrCollection;
		}
		return attrs;
	}
}
const parseXml = function(xmlData) {
	xmlData = xmlData.replace(/\r\n?/g, "\n");
	const xmlObj = new XmlNode("!xml");
	let currentNode = xmlObj;
	let textData = "";
	let jPath = "";
	this.entityExpansionCount = 0;
	this.currentExpandedLength = 0;
	const docTypeReader = new DocTypeReader(this.options.processEntities);
	for (let i$2 = 0; i$2 < xmlData.length; i$2++) {
		const ch = xmlData[i$2];
		if (ch === "<") if (xmlData[i$2 + 1] === "/") {
			const closeIndex = findClosingIndex(xmlData, ">", i$2, "Closing Tag is not closed.");
			let tagName = xmlData.substring(i$2 + 2, closeIndex).trim();
			if (this.options.removeNSPrefix) {
				const colonIndex = tagName.indexOf(":");
				if (colonIndex !== -1) tagName = tagName.substr(colonIndex + 1);
			}
			if (this.options.transformTagName) tagName = this.options.transformTagName(tagName);
			if (currentNode) textData = this.saveTextToParentTag(textData, currentNode, jPath);
			const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
			if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
			let propIndex = 0;
			if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
				propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
				this.tagsNodeStack.pop();
			} else propIndex = jPath.lastIndexOf(".");
			jPath = jPath.substring(0, propIndex);
			currentNode = this.tagsNodeStack.pop();
			textData = "";
			i$2 = closeIndex;
		} else if (xmlData[i$2 + 1] === "?") {
			let tagData = readTagExp(xmlData, i$2, false, "?>");
			if (!tagData) throw new Error("Pi Tag is not closed.");
			textData = this.saveTextToParentTag(textData, currentNode, jPath);
			if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
				const childNode = new XmlNode(tagData.tagName);
				childNode.add(this.options.textNodeName, "");
				if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
				this.addChild(currentNode, childNode, jPath, i$2);
			}
			i$2 = tagData.closeIndex + 1;
		} else if (xmlData.substr(i$2 + 1, 3) === "!--") {
			const endIndex = findClosingIndex(xmlData, "-->", i$2 + 4, "Comment is not closed.");
			if (this.options.commentPropName) {
				const comment = xmlData.substring(i$2 + 4, endIndex - 2);
				textData = this.saveTextToParentTag(textData, currentNode, jPath);
				currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
			}
			i$2 = endIndex;
		} else if (xmlData.substr(i$2 + 1, 2) === "!D") {
			const result = docTypeReader.readDocType(xmlData, i$2);
			this.docTypeEntities = result.entities;
			i$2 = result.i;
		} else if (xmlData.substr(i$2 + 1, 2) === "![") {
			const closeIndex = findClosingIndex(xmlData, "]]>", i$2, "CDATA is not closed.") - 2;
			const tagExp = xmlData.substring(i$2 + 9, closeIndex);
			textData = this.saveTextToParentTag(textData, currentNode, jPath);
			let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
			if (val == void 0) val = "";
			if (this.options.cdataPropName) currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
			else currentNode.add(this.options.textNodeName, val);
			i$2 = closeIndex + 2;
		} else {
			let result = readTagExp(xmlData, i$2, this.options.removeNSPrefix);
			let tagName = result.tagName;
			const rawTagName = result.rawTagName;
			let tagExp = result.tagExp;
			let attrExpPresent = result.attrExpPresent;
			let closeIndex = result.closeIndex;
			if (this.options.transformTagName) {
				const newTagName = this.options.transformTagName(tagName);
				if (tagExp === tagName) tagExp = newTagName;
				tagName = newTagName;
			}
			if (currentNode && textData) {
				if (currentNode.tagname !== "!xml") textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
			}
			const lastTag = currentNode;
			if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
				currentNode = this.tagsNodeStack.pop();
				jPath = jPath.substring(0, jPath.lastIndexOf("."));
			}
			if (tagName !== xmlObj.tagname) jPath += jPath ? "." + tagName : tagName;
			const startIndex = i$2;
			if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
				let tagContent = "";
				if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
					if (tagName[tagName.length - 1] === "/") {
						tagName = tagName.substr(0, tagName.length - 1);
						jPath = jPath.substr(0, jPath.length - 1);
						tagExp = tagName;
					} else tagExp = tagExp.substr(0, tagExp.length - 1);
					i$2 = result.closeIndex;
				} else if (this.options.unpairedTags.indexOf(tagName) !== -1) i$2 = result.closeIndex;
				else {
					const result$1 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
					if (!result$1) throw new Error(`Unexpected end of ${rawTagName}`);
					i$2 = result$1.i;
					tagContent = result$1.tagContent;
				}
				const childNode = new XmlNode(tagName);
				if (tagName !== tagExp && attrExpPresent) childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
				if (tagContent) tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
				jPath = jPath.substr(0, jPath.lastIndexOf("."));
				childNode.add(this.options.textNodeName, tagContent);
				this.addChild(currentNode, childNode, jPath, startIndex);
			} else {
				if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
					if (tagName[tagName.length - 1] === "/") {
						tagName = tagName.substr(0, tagName.length - 1);
						jPath = jPath.substr(0, jPath.length - 1);
						tagExp = tagName;
					} else tagExp = tagExp.substr(0, tagExp.length - 1);
					if (this.options.transformTagName) {
						const newTagName = this.options.transformTagName(tagName);
						if (tagExp === tagName) tagExp = newTagName;
						tagName = newTagName;
					}
					const childNode = new XmlNode(tagName);
					if (tagName !== tagExp && attrExpPresent) childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
					this.addChild(currentNode, childNode, jPath, startIndex);
					jPath = jPath.substr(0, jPath.lastIndexOf("."));
				} else {
					const childNode = new XmlNode(tagName);
					this.tagsNodeStack.push(currentNode);
					if (tagName !== tagExp && attrExpPresent) childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
					this.addChild(currentNode, childNode, jPath, startIndex);
					currentNode = childNode;
				}
				textData = "";
				i$2 = closeIndex;
			}
		}
		else textData += xmlData[i$2];
	}
	return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
	if (!this.options.captureMetaData) startIndex = void 0;
	const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
	if (result === false) {} else if (typeof result === "string") {
		childNode.tagname = result;
		currentNode.addChild(childNode, startIndex);
	} else currentNode.addChild(childNode, startIndex);
}
const replaceEntitiesValue = function(val, tagName, jPath) {
	if (val.indexOf("&") === -1) return val;
	const entityConfig = this.options.processEntities;
	if (!entityConfig.enabled) return val;
	if (entityConfig.allowedTags) {
		if (!entityConfig.allowedTags.includes(tagName)) return val;
	}
	if (entityConfig.tagFilter) {
		if (!entityConfig.tagFilter(tagName, jPath)) return val;
	}
	for (let entityName in this.docTypeEntities) {
		const entity = this.docTypeEntities[entityName];
		const matches = val.match(entity.regx);
		if (matches) {
			this.entityExpansionCount += matches.length;
			if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
			const lengthBefore = val.length;
			val = val.replace(entity.regx, entity.val);
			if (entityConfig.maxExpandedLength) {
				this.currentExpandedLength += val.length - lengthBefore;
				if (this.currentExpandedLength > entityConfig.maxExpandedLength) throw new Error(`Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`);
			}
		}
	}
	if (val.indexOf("&") === -1) return val;
	for (let entityName in this.lastEntities) {
		const entity = this.lastEntities[entityName];
		val = val.replace(entity.regex, entity.val);
	}
	if (val.indexOf("&") === -1) return val;
	if (this.options.htmlEntities) for (let entityName in this.htmlEntities) {
		const entity = this.htmlEntities[entityName];
		val = val.replace(entity.regex, entity.val);
	}
	val = val.replace(this.ampEntity.regex, this.ampEntity.val);
	return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
	if (textData) {
		if (isLeafNode === void 0) isLeafNode = currentNode.child.length === 0;
		textData = this.parseTextData(textData, currentNode.tagname, jPath, false, currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false, isLeafNode);
		if (textData !== void 0 && textData !== "") currentNode.add(this.options.textNodeName, textData);
		textData = "";
	}
	return textData;
}
/**
* @param {Set} stopNodesExact
* @param {Set} stopNodesWildcard
* @param {string} jPath
* @param {string} currentTagName
*/
function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
	if (stopNodesWildcard && stopNodesWildcard.has(currentTagName)) return true;
	if (stopNodesExact && stopNodesExact.has(jPath)) return true;
	return false;
}
/**
* Returns the tag Expression and where it is ending handling single-double quotes situation
* @param {string} xmlData 
* @param {number} i starting index
* @returns 
*/
function tagExpWithClosingIndex(xmlData, i$2, closingChar = ">") {
	let attrBoundary;
	let tagExp = "";
	for (let index = i$2; index < xmlData.length; index++) {
		let ch = xmlData[index];
		if (attrBoundary) {
			if (ch === attrBoundary) attrBoundary = "";
		} else if (ch === "\"" || ch === "'") attrBoundary = ch;
		else if (ch === closingChar[0]) if (closingChar[1]) {
			if (xmlData[index + 1] === closingChar[1]) return {
				data: tagExp,
				index
			};
		} else return {
			data: tagExp,
			index
		};
		else if (ch === "	") ch = " ";
		tagExp += ch;
	}
}
function findClosingIndex(xmlData, str$1, i$2, errMsg) {
	const closingIndex = xmlData.indexOf(str$1, i$2);
	if (closingIndex === -1) throw new Error(errMsg);
	else return closingIndex + str$1.length - 1;
}
function readTagExp(xmlData, i$2, removeNSPrefix, closingChar = ">") {
	const result = tagExpWithClosingIndex(xmlData, i$2 + 1, closingChar);
	if (!result) return;
	let tagExp = result.data;
	const closeIndex = result.index;
	const separatorIndex = tagExp.search(/\s/);
	let tagName = tagExp;
	let attrExpPresent = true;
	if (separatorIndex !== -1) {
		tagName = tagExp.substring(0, separatorIndex);
		tagExp = tagExp.substring(separatorIndex + 1).trimStart();
	}
	const rawTagName = tagName;
	if (removeNSPrefix) {
		const colonIndex = tagName.indexOf(":");
		if (colonIndex !== -1) {
			tagName = tagName.substr(colonIndex + 1);
			attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
		}
	}
	return {
		tagName,
		tagExp,
		closeIndex,
		attrExpPresent,
		rawTagName
	};
}
/**
* find paired tag for a stop node
* @param {string} xmlData 
* @param {string} tagName 
* @param {number} i 
*/
function readStopNodeData(xmlData, tagName, i$2) {
	const startIndex = i$2;
	let openTagCount = 1;
	for (; i$2 < xmlData.length; i$2++) if (xmlData[i$2] === "<") if (xmlData[i$2 + 1] === "/") {
		const closeIndex = findClosingIndex(xmlData, ">", i$2, `${tagName} is not closed`);
		let closeTagName = xmlData.substring(i$2 + 2, closeIndex).trim();
		if (closeTagName === tagName) {
			openTagCount--;
			if (openTagCount === 0) return {
				tagContent: xmlData.substring(startIndex, i$2),
				i: closeIndex
			};
		}
		i$2 = closeIndex;
	} else if (xmlData[i$2 + 1] === "?") {
		const closeIndex = findClosingIndex(xmlData, "?>", i$2 + 1, "StopNode is not closed.");
		i$2 = closeIndex;
	} else if (xmlData.substr(i$2 + 1, 3) === "!--") {
		const closeIndex = findClosingIndex(xmlData, "-->", i$2 + 3, "StopNode is not closed.");
		i$2 = closeIndex;
	} else if (xmlData.substr(i$2 + 1, 2) === "![") {
		const closeIndex = findClosingIndex(xmlData, "]]>", i$2, "StopNode is not closed.") - 2;
		i$2 = closeIndex;
	} else {
		const tagData = readTagExp(xmlData, i$2, ">");
		if (tagData) {
			const openTagName = tagData && tagData.tagName;
			if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") openTagCount++;
			i$2 = tagData.closeIndex;
		}
	}
}
function parseValue(val, shouldParse, options) {
	if (shouldParse && typeof val === "string") {
		const newval = val.trim();
		if (newval === "true") return true;
		else if (newval === "false") return false;
		else return toNumber(val, options);
	} else if (isExist(val)) return val;
	else return "";
}
function fromCodePoint(str$1, base, prefix) {
	const codePoint = Number.parseInt(str$1, base);
	if (codePoint >= 0 && codePoint <= 1114111) return String.fromCodePoint(codePoint);
	else return prefix + str$1 + ";";
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/node2json.js
const METADATA_SYMBOL = XmlNode.getMetaDataSymbol();
/**
* 
* @param {array} node 
* @param {any} options 
* @returns 
*/
function prettify(node, options) {
	return compress(node, options);
}
/**
* 
* @param {array} arr 
* @param {object} options 
* @param {string} jPath 
* @returns object
*/
function compress(arr, options, jPath) {
	let text;
	const compressedObj = {};
	for (let i$2 = 0; i$2 < arr.length; i$2++) {
		const tagObj = arr[i$2];
		const property = propName(tagObj);
		let newJpath = "";
		if (jPath === void 0) newJpath = property;
		else newJpath = jPath + "." + property;
		if (property === options.textNodeName) if (text === void 0) text = tagObj[property];
		else text += "" + tagObj[property];
		else if (property === void 0) continue;
		else if (tagObj[property]) {
			let val = compress(tagObj[property], options, newJpath);
			const isLeaf = isLeafTag(val, options);
			if (tagObj[METADATA_SYMBOL] !== void 0) val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL];
			if (tagObj[":@"]) assignAttributes(val, tagObj[":@"], newJpath, options);
			else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) val = val[options.textNodeName];
			else if (Object.keys(val).length === 0) if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
			else val = "";
			if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
				if (!Array.isArray(compressedObj[property])) compressedObj[property] = [compressedObj[property]];
				compressedObj[property].push(val);
			} else if (options.isArray(property, newJpath, isLeaf)) compressedObj[property] = [val];
			else compressedObj[property] = val;
		}
	}
	if (typeof text === "string") {
		if (text.length > 0) compressedObj[options.textNodeName] = text;
	} else if (text !== void 0) compressedObj[options.textNodeName] = text;
	return compressedObj;
}
function propName(obj) {
	const keys = Object.keys(obj);
	for (let i$2 = 0; i$2 < keys.length; i$2++) {
		const key = keys[i$2];
		if (key !== ":@") return key;
	}
}
function assignAttributes(obj, attrMap, jpath, options) {
	if (attrMap) {
		const keys = Object.keys(attrMap);
		const len = keys.length;
		for (let i$2 = 0; i$2 < len; i$2++) {
			const atrrName = keys[i$2];
			if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) obj[atrrName] = [attrMap[atrrName]];
			else obj[atrrName] = attrMap[atrrName];
		}
	}
}
function isLeafTag(obj, options) {
	const { textNodeName } = options;
	const propCount = Object.keys(obj).length;
	if (propCount === 0) return true;
	if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) return true;
	return false;
}

//#endregion
//#region ../../node_modules/.pnpm/fast-xml-parser@5.3.6/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var XMLParser = class {
	constructor(options) {
		this.externalEntities = {};
		this.options = buildOptions(options);
	}
	/**
	* Parse XML dats to JS object 
	* @param {string|Uint8Array} xmlData 
	* @param {boolean|Object} validationOption 
	*/
	parse(xmlData, validationOption) {
		if (typeof xmlData !== "string" && xmlData.toString) xmlData = xmlData.toString();
		else if (typeof xmlData !== "string") throw new Error("XML data is accepted in String or Bytes[] form.");
		if (validationOption) {
			if (validationOption === true) validationOption = {};
			const result = validate(xmlData, validationOption);
			if (result !== true) throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
		}
		const orderedObjParser = new OrderedObjParser(this.options);
		orderedObjParser.addExternalEntities(this.externalEntities);
		const orderedResult = orderedObjParser.parseXml(xmlData);
		if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
		else return prettify(orderedResult, this.options);
	}
	/**
	* Add Entity which is not by default supported by this library
	* @param {string} key 
	* @param {string} value 
	*/
	addEntity(key, value) {
		if (value.indexOf("&") !== -1) throw new Error("Entity value can't have '&'");
		else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
		else if (value === "&") throw new Error("An entity with value '&' is not permitted");
		else this.externalEntities[key] = value;
	}
	/**
	* Returns a Symbol that can be used to access the metadata
	* property on a node.
	* 
	* If Symbol is not available in the environment, an ordinary property is used
	* and the name of the property is here returned.
	* 
	* The XMLMetaData property is only present when `captureMetaData`
	* is true in the options.
	*/
	static getMetaDataSymbol() {
		return XmlNode.getMetaDataSymbol();
	}
};

//#endregion
//#region src/cli/computers/validation.computer.ts
/**
* Directive validation phases.
* Keep in sync with apps/vscode/src/computers/directive-validator.computer.ts
*/
const VALID_PHASES = [
	"check",
	"complete",
	"complete-project",
	"create",
	"create-project",
	"define",
	"delete",
	"directive",
	"finalize",
	"implement",
	"map-engineering",
	"map-product",
	"plan",
	"quick",
	"rework",
	"save",
	"scope"
];
/**
* Directive validation severities.
*/
const VALID_SEVERITIES = [
	"error",
	"warning",
	"info"
];
/**
* Directive check types.
*/
const VALID_CHECK_TYPES = [
	"command",
	"pattern",
	"checklist"
];
/**
* Documentation quality checks.
*/
const DOC_QUALITY_CHECKS = [
	{
		name: "has-tldr",
		check: (fm) => typeof fm.tldr === "string" && fm.tldr.length > 10,
		severity: "error",
		message: "Missing or too short tldr (need >10 chars)"
	},
	{
		name: "has-summary",
		check: (fm) => typeof fm.summary === "string" && fm.summary.length > 50,
		severity: "error",
		message: "Missing or too short summary (need >50 chars)"
	},
	{
		name: "has-keywords",
		check: (fm) => Array.isArray(fm.keywords) && fm.keywords.length >= 2,
		severity: "warning",
		message: "Need at least 2 keywords for search"
	},
	{
		name: "has-overview",
		check: (_, body) => body.includes("## Overview") || body.includes("## What is this"),
		severity: "error",
		message: "Missing Overview section"
	},
	{
		name: "has-examples",
		check: (_, body) => body.includes("```") || body.includes("## Examples"),
		severity: "warning",
		message: "No code examples found"
	},
	{
		name: "has-boundaries",
		check: (fm, body) => typeof fm.boundary === "string" && fm.boundary.length > 0 || body.includes("## Boundaries") || body.includes("Does NOT"),
		severity: "warning",
		message: "No boundaries defined (helps prevent false positives in search)"
	},
	{
		name: "not-too-short",
		check: (_, body) => body.length > 300,
		severity: "warning",
		message: "Content too short (<300 chars) - may lack detail"
	},
	{
		name: "not-too-long",
		check: (_, body) => body.length < 5e3,
		severity: "warning",
		message: "Content too long (>5000 chars) - consider splitting"
	},
	{
		name: "has-intent",
		check: (fm) => {
			if (typeof fm.intent !== "string") return false;
			return [
				"reference",
				"procedural",
				"conceptual"
			].includes(fm.intent);
		},
		severity: "warning",
		message: "Missing or invalid intent field (expected: reference, procedural, or conceptual)"
	}
];
/**
* Create a validation computer.
*
* @returns A ValidationComputer instance.
*/
function createValidationComputer() {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		textNodeName: "_text",
		isArray: (tagName) => [
			"principle",
			"rule",
			"check",
			"item",
			"example",
			"override",
			"skip"
		].includes(tagName)
	});
	function validateXml(content) {
		try {
			parser.parse(content);
			return {
				valid: true,
				errors: [],
				warnings: []
			};
		} catch (err$1) {
			return {
				valid: false,
				errors: [err$1 instanceof Error ? err$1.message : String(err$1)],
				warnings: []
			};
		}
	}
	function validateDirective(content, expectedName) {
		const errors = [];
		const warnings = [];
		let parsed;
		try {
			parsed = parser.parse(content);
		} catch (err$1) {
			return {
				valid: false,
				errors: [`XML parse error: ${err$1 instanceof Error ? err$1.message : String(err$1)}`],
				warnings: []
			};
		}
		const directive = parsed.directive;
		if (!directive) return {
			valid: false,
			errors: ["Missing root <directive> element"],
			warnings: []
		};
		const name = directive.name;
		const version = directive.version;
		const created = directive.created;
		const updated = directive.updated;
		if (!name) errors.push("Missing required attribute: name");
		else if (name !== expectedName) errors.push(`Directive name "${name}" doesn't match filename "${expectedName}"`);
		if (!version) errors.push("Missing required attribute: version");
		if (!created) errors.push("Missing required attribute: created");
		else if (!/^\d{4}-\d{2}-\d{2}$/.test(created)) errors.push(`Invalid created date format: "${created}" (expected YYYY-MM-DD)`);
		if (!updated) errors.push("Missing required attribute: updated");
		else if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) errors.push(`Invalid updated date format: "${updated}" (expected YYYY-MM-DD)`);
		const allIds = new Set();
		const duplicateIds = [];
		function checkId(id, section) {
			if (!id) {
				errors.push(`Missing required id attribute in ${section}`);
				return;
			}
			if (allIds.has(id)) duplicateIds.push(id);
			allIds.add(id);
		}
		const context = directive.context;
		if (context) {
			const principles = context.principle;
			if (principles) for (const principle of principles) checkId(principle.id, "<context><principle>");
		}
		const process$1 = directive.process;
		if (process$1) {
			const rules = process$1.rule;
			if (rules) for (const rule of rules) {
				checkId(rule.id, "<process><rule>");
				const phase = rule.phase;
				if (!phase) errors.push(`Missing required phase attribute in <process><rule id="${rule.id}">`);
				else {
					const phases = phase.split(",").map((p) => p.trim());
					for (const p of phases) if (!VALID_PHASES.includes(p)) errors.push(`Invalid phase "${p}" in <rule id="${rule.id}">. Valid: ${VALID_PHASES.join(", ")}`);
				}
			}
		}
		const validation = directive.validation;
		if (validation) {
			const checks = validation.check;
			if (checks) for (const check of checks) {
				checkId(check.id, "<validation><check>");
				const type$1 = check.type;
				if (!type$1) errors.push(`Missing required type attribute in <validation><check id="${check.id}">`);
				else if (!VALID_CHECK_TYPES.includes(type$1)) errors.push(`Invalid check type "${type$1}" in <check id="${check.id}">. Valid: ${VALID_CHECK_TYPES.join(", ")}`);
				const severity = check.severity;
				if (!severity) errors.push(`Missing required severity attribute in <validation><check id="${check.id}">`);
				else if (!VALID_SEVERITIES.includes(severity)) errors.push(`Invalid severity "${severity}" in <check id="${check.id}">. Valid: ${VALID_SEVERITIES.join(", ")}`);
				if (type$1 === "command") {
					if (!check.run) errors.push(`Command check <check id="${check.id}"> missing <run> element`);
					if (!check.expect) errors.push(`Command check <check id="${check.id}"> missing <expect> element`);
				} else if (type$1 === "pattern") {
					if (check.required) errors.push(`Pattern check <check id="${check.id}"> contains <required> element — pattern checks only support <forbidden>`);
					if (!check.forbidden) errors.push(`Pattern check <check id="${check.id}"> missing <forbidden> element`);
					if (!check.reason) errors.push(`Pattern check <check id="${check.id}"> missing <reason> element`);
					if (!check.files) warnings.push(`Pattern check <check id="${check.id}"> has no files attribute (will match nothing)`);
				} else if (type$1 === "checklist") {
					const items = check.item;
					if (!items || items.length === 0) errors.push(`Checklist check <check id="${check.id}"> has no <item> elements`);
				}
			}
		}
		if (duplicateIds.length > 0) errors.push(`Duplicate IDs found: ${duplicateIds.join(", ")}`);
		if (!context && !process$1 && !validation) warnings.push("Directive has no content sections (context, process, or validation)");
		return {
			valid: errors.length === 0,
			errors,
			warnings
		};
	}
	/**
	* Valid project statuses.
	*/
	const VALID_PROJECT_STATUSES = [
		"open",
		"in-progress",
		"done"
	];
	function validateProject(content) {
		const errors = [];
		const warnings = [];
		let parsed;
		try {
			parsed = parser.parse(content);
		} catch (err$1) {
			return {
				valid: false,
				errors: [`XML parse error: ${err$1 instanceof Error ? err$1.message : String(err$1)}`],
				warnings: []
			};
		}
		const project = parsed.project;
		if (!project) return {
			valid: false,
			errors: ["Missing root <project> element"],
			warnings: []
		};
		const id = project.id;
		const status = project.status;
		const created = project.created;
		const updated = project.updated;
		if (!id) errors.push("Missing required attribute: id");
		else if (!/^P/.test(id)) errors.push(`Project id must start with "P", got "${id}"`);
		if (!status) errors.push("Missing required attribute: status");
		else if (!VALID_PROJECT_STATUSES.includes(status)) errors.push(`Invalid status "${status}". Valid: ${VALID_PROJECT_STATUSES.join(", ")}`);
		if (!created) errors.push("Missing required attribute: created");
		else if (!/^\d{4}-\d{2}-\d{2}$/.test(created)) errors.push(`Invalid created date format: "${created}" (expected YYYY-MM-DD)`);
		if (!updated) errors.push("Missing required attribute: updated");
		else if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) errors.push(`Invalid updated date format: "${updated}" (expected YYYY-MM-DD)`);
		const requiredChildren = [
			"title",
			"description",
			"problem",
			"value",
			"scope",
			"requirements",
			"acceptance-criteria",
			"tasks"
		];
		for (const child of requiredChildren) if (project[child] === void 0 || project[child] === null) errors.push(`Missing required element: <${child}>`);
		const scope = project.scope;
		if (scope) {
			if (scope["in-scope"] === void 0 || scope["in-scope"] === null) errors.push("Missing required element: <scope><in-scope>");
			if (scope["out-of-scope"] === void 0 || scope["out-of-scope"] === null) errors.push("Missing required element: <scope><out-of-scope>");
		}
		const requirements = project.requirements;
		if (requirements) {
			const req = requirements.requirement;
			const reqList = Array.isArray(req) ? req : req ? [req] : [];
			const seenIds = new Set();
			for (const r of reqList) {
				const rObj = r;
				const reqId = rObj.id;
				if (!reqId) errors.push("Requirement missing required id attribute");
				else {
					if (!/^R\d+$/.test(reqId)) errors.push(`Requirement id must match R-prefix pattern (e.g. R1, R2), got "${reqId}"`);
					if (seenIds.has(reqId)) errors.push(`Duplicate requirement id: "${reqId}"`);
					seenIds.add(reqId);
				}
			}
			if (reqList.length === 0) warnings.push("No <requirement> elements found inside <requirements>");
		}
		const tasks = project.tasks;
		if (tasks) {
			const task = tasks.task;
			const taskList = Array.isArray(task) ? task : task ? [task] : [];
			for (const t of taskList) {
				const tObj = t;
				const ref = tObj.ref;
				if (!ref) errors.push("Task element missing required ref attribute");
			}
		}
		return {
			valid: errors.length === 0,
			errors,
			warnings
		};
	}
	function validateDocQuality(frontmatter, body, id, path$2) {
		const checks = [];
		let hasError = false;
		let hasWarning = false;
		for (const check of DOC_QUALITY_CHECKS) {
			const passed = check.check(frontmatter, body);
			checks.push({
				name: check.name,
				passed,
				severity: check.severity,
				message: passed ? void 0 : check.message
			});
			if (!passed) if (check.severity === "error") hasError = true;
			else hasWarning = true;
		}
		return {
			id,
			path: path$2,
			status: hasError ? "error" : hasWarning ? "warning" : "pass",
			checks
		};
	}
	function getQualityChecks() {
		return DOC_QUALITY_CHECKS;
	}
	return {
		validateXml,
		validateDirective,
		validateProject,
		validateDocQuality,
		getQualityChecks
	};
}

//#endregion
//#region src/cli/handlers/validation.handler.ts
const TASKS_DIR = ".festinalente/tasks";
const QUICK_DIR = ".festinalente/quick";
const PRODUCT_DIR = ".festinalente/product";
const ENGINEERING_DIR = ".festinalente/engineering";
const DIRECTIVES_DIR = ".festinalente/directives";
const PROJECTS_DIR = ".festinalente/projects";
/**
* Create a validation handler.
*
* @param deps - The dependencies.
* @returns A ValidationHandler instance.
*/
function createValidationHandler(deps) {
	const { fs: fs$3, yamlParser, validation, taskResolver } = deps;
	/**
	* Get XML files for a project.
	*/
	function getXmlFilesForProject(projectId) {
		const projectDir = fs$3.joinPath(PROJECTS_DIR, projectId);
		if (!fs$3.exists(projectDir) || !fs$3.isDirectory(projectDir)) return null;
		const files = [];
		const projectXml = fs$3.joinPath(projectDir, "project.xml");
		if (fs$3.exists(projectXml)) files.push(projectXml);
		return files;
	}
	/**
	* Get XML files for a quick task.
	*/
	function getXmlFilesForQuick(quickId) {
		const quickDir = fs$3.joinPath(QUICK_DIR, quickId);
		if (!fs$3.exists(quickDir) || !fs$3.isDirectory(quickDir)) return null;
		const files = [];
		const quickXml = fs$3.joinPath(quickDir, "quick.xml");
		if (fs$3.exists(quickXml)) files.push(quickXml);
		return files;
	}
	/**
	* Get XML files for a task.
	*/
	function getXmlFilesForTask(taskId) {
		if (taskId.startsWith("quick/")) {
			const quickId = taskId.slice(6);
			return getXmlFilesForQuick(quickId);
		}
		const dirsResult = fs$3.listDirectories(TASKS_DIR);
		const resolvedId = dirsResult.ok ? taskResolver.resolveTaskFolder(dirsResult.value, taskId) ?? taskId : taskId;
		const taskDir = fs$3.joinPath(TASKS_DIR, resolvedId);
		if (!fs$3.exists(taskDir) || !fs$3.isDirectory(taskDir)) return null;
		const files = [];
		const xmlFiles = [
			"task.xml",
			"spec.xml",
			"plan.xml"
		];
		for (const xmlFile of xmlFiles) {
			const filePath = fs$3.joinPath(taskDir, xmlFile);
			if (fs$3.exists(filePath)) files.push(filePath);
		}
		return files;
	}
	/**
	* Get all XML files in tasks directory.
	*/
	function getAllXmlFiles() {
		const files = [];
		if (!fs$3.exists(TASKS_DIR)) return files;
		const dirsResult = fs$3.listDirectories(TASKS_DIR);
		if (!dirsResult.ok) return files;
		for (const dir of dirsResult.value) {
			const taskDir = fs$3.joinPath(TASKS_DIR, dir);
			const xmlFiles = [
				"task.xml",
				"spec.xml",
				"plan.xml"
			];
			for (const xmlFile of xmlFiles) {
				const filePath = fs$3.joinPath(taskDir, xmlFile);
				if (fs$3.exists(filePath)) files.push(filePath);
			}
		}
		return files;
	}
	/**
	* Validate XML command.
	*/
	function validateXml(args) {
		const parsed = parseArgs(args);
		let files;
		if (parsed.positional.length > 0) {
			const id = parsed.positional[0];
			if (id.startsWith("P")) {
				const projectFiles = getXmlFilesForProject(id);
				if (projectFiles === null) return error(`Project not found: ${id}`);
				files = projectFiles;
			} else {
				const taskFiles = getXmlFilesForTask(id);
				if (taskFiles === null) return error(`Task not found: ${id}`);
				files = taskFiles;
			}
		} else files = getAllXmlFiles();
		if (files.length === 0) return success({
			valid: true,
			filesChecked: 0,
			errors: []
		});
		const errors = [];
		for (const file of files) {
			const readResult = fs$3.readFile(file);
			if (!readResult.ok) {
				errors.push({
					file: file.replace(/\\/g, "/"),
					message: readResult.error.message
				});
				continue;
			}
			const isProjectXml = file.replace(/\\/g, "/").endsWith("/project.xml");
			const validationResult = isProjectXml ? validation.validateProject(readResult.value) : validation.validateXml(readResult.value);
			if (!validationResult.valid) for (const errMsg of validationResult.errors) errors.push({
				file: file.replace(/\\/g, "/"),
				message: errMsg
			});
		}
		return success({
			valid: errors.length === 0,
			filesChecked: files.length,
			errors
		});
	}
	/**
	* Get all markdown files in tasks directory.
	*/
	function getAllTaskMdFiles() {
		const files = [];
		if (!fs$3.exists(TASKS_DIR)) return files;
		const dirsResult = fs$3.listDirectories(TASKS_DIR);
		if (!dirsResult.ok) return files;
		for (const dir of dirsResult.value) {
			const taskDir = fs$3.joinPath(TASKS_DIR, dir);
			const mdFiles = [
				"task.md",
				"spec.md",
				"plan.md"
			];
			for (const mdFile of mdFiles) {
				const filePath = fs$3.joinPath(taskDir, mdFile);
				if (fs$3.exists(filePath)) files.push(filePath.replace(/\\/g, "/"));
			}
		}
		return files;
	}
	/**
	* Validate YAML command.
	*/
	function validateYamlCommand(_args) {
		if (!fs$3.exists(TASKS_DIR)) return error(`${TASKS_DIR}/ directory not found.`);
		const files = getAllTaskMdFiles();
		const errors = [];
		for (const file of files) {
			const readResult = fs$3.readFile(file);
			if (!readResult.ok) {
				errors.push({
					file,
					message: readResult.error.message
				});
				continue;
			}
			try {
				yamlParser.parseFrontmatter(readResult.value);
			} catch (err$1) {
				errors.push({
					file,
					message: err$1 instanceof Error ? err$1.message : String(err$1)
				});
			}
		}
		return success({
			valid: errors.length === 0,
			errors
		});
	}
	/**
	* Validate directive command.
	*/
	function validateDirectiveCommand(args) {
		const parsed = parseArgs(args);
		if (parsed.positional.length === 0) return error("Usage: validate-directive <directive-name>");
		const directiveName = parsed.positional[0];
		const filePath = fs$3.joinPath(DIRECTIVES_DIR, `${directiveName}.xml`);
		if (!fs$3.exists(filePath)) return error(`Directive file not found: ${filePath}`);
		const readResult = fs$3.readFile(filePath);
		if (!readResult.ok) return error(`Failed to read directive file: ${readResult.error.message}`);
		const result = validation.validateDirective(readResult.value, directiveName);
		return success({
			valid: result.valid,
			errors: result.errors,
			warnings: result.warnings
		});
	}
	/**
	* Derive ID from doc path.
	*/
	function deriveIdFromPath(docPath, baseDir) {
		const relativePath = fs$3.relativePath(baseDir, docPath).replace(/\\/g, "/");
		let id = relativePath.replace(/\.md$/, "");
		if (id.endsWith("/_index")) id = id.replace(/\/_index$/, "");
		return id;
	}
	/**
	* Validate documentation quality command.
	*/
	function validateDocs(args) {
		const parsed = parseArgs(args);
		const typeFilter = getStringFlag(parsed.flags, "type");
		const results = [];
		const allDocPaths = [];
		if (!typeFilter || typeFilter === "product") {
			const scanResult = fs$3.scanRecursive(PRODUCT_DIR, ".md");
			if (scanResult.ok) for (const docPath of scanResult.value) {
				allDocPaths.push({
					path: docPath,
					baseDir: PRODUCT_DIR
				});
				const readResult = fs$3.readFile(docPath);
				if (!readResult.ok) continue;
				const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
				const id = deriveIdFromPath(docPath, PRODUCT_DIR);
				const normalizedPath = docPath.replace(/\\/g, "/");
				const result = validation.validateDocQuality(frontmatter, body, id, normalizedPath);
				results.push(result);
			}
		}
		if (!typeFilter || typeFilter === "engineering") {
			const scanResult = fs$3.scanRecursive(ENGINEERING_DIR, ".md");
			if (scanResult.ok) for (const docPath of scanResult.value) {
				allDocPaths.push({
					path: docPath,
					baseDir: ENGINEERING_DIR
				});
				const readResult = fs$3.readFile(docPath);
				if (!readResult.ok) continue;
				const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);
				const id = deriveIdFromPath(docPath, ENGINEERING_DIR);
				const normalizedPath = docPath.replace(/\\/g, "/");
				const result = validation.validateDocQuality(frontmatter, body, id, normalizedPath);
				results.push(result);
			}
		}
		const allDocIds = new Set(results.map((r) => r.id));
		const brokenRefs = [];
		const referencedIds = new Set();
		for (const { path: docPath, baseDir } of allDocPaths) {
			const readResult = fs$3.readFile(docPath);
			if (!readResult.ok) continue;
			const { data: fm } = yamlParser.parseFrontmatter(readResult.value);
			const docId = deriveIdFromPath(docPath, baseDir);
			const references = Array.isArray(fm.references) ? fm.references : [];
			const uses = Array.isArray(fm.uses) ? fm.uses : [];
			for (const ref of references) {
				referencedIds.add(ref);
				if (!allDocIds.has(ref)) brokenRefs.push({
					doc: docId,
					field: "references",
					target: ref
				});
			}
			for (const use of uses) {
				referencedIds.add(use);
				if (!allDocIds.has(use)) brokenRefs.push({
					doc: docId,
					field: "uses",
					target: use
				});
			}
		}
		const orphanDocs = [];
		for (const id of allDocIds) if (!referencedIds.has(id) && !id.endsWith("overview") && id !== "overview") orphanDocs.push(id);
		const passing = results.filter((r) => r.status === "pass").length;
		const warnings = results.filter((r) => r.status === "warning").length;
		const errorsCount = results.filter((r) => r.status === "error").length;
		return success({
			totalDocs: results.length,
			passing,
			warnings,
			errors: errorsCount,
			results,
			brokenRefs,
			orphanDocs
		});
	}
	/**
	* Get command definitions.
	*/
	function getCommands() {
		return [
			defineCommand("validate-xml", "Validate XML in task files", "validate-xml [taskId]", validateXml),
			defineCommand("validate-yaml", "Validate YAML frontmatter in task files", "validate-yaml", validateYamlCommand),
			defineCommand("validate-directive", "Validate a directive XML file", "validate-directive <directive-name>", validateDirectiveCommand),
			defineCommand("validate-docs", "Validate documentation quality", "validate-docs [--type=product|engineering]", validateDocs)
		];
	}
	return {
		validateXml,
		validateYaml: validateYamlCommand,
		validateDirective: validateDirectiveCommand,
		validateDocs,
		getCommands
	};
}

//#endregion
//#region src/cli/computers/xml-parser.computer.ts
/**
* Create an XML parser computer.
*
* @returns An XmlParserComputer instance.
*/
function createXmlParserComputer() {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		textNodeName: "_text"
	});
	/**
	* Parse ref elements to extract IDs.
	*/
	function parseRefs(section) {
		if (!section) return [];
		const sectionObj = section;
		const ref = sectionObj.ref;
		if (Array.isArray(ref)) return ref.map((r) => {
			if (typeof r === "string") return r.trim();
			if (typeof r === "object" && r && "_text" in r) return String(r._text).trim();
			return "";
		}).filter(Boolean);
		if (typeof ref === "string") return [ref.trim()];
		if (typeof ref === "object" && ref && "_text" in ref) return [String(ref._text).trim()];
		return [];
	}
	/**
	* Parse doc elements to extract id attributes.
	*
	* @param section - The section containing doc elements.
	* @returns Array of doc id strings.
	*/
	function parseDocIds(section) {
		if (!section) return [];
		const sectionObj = section;
		const doc = sectionObj.doc;
		if (Array.isArray(doc)) return doc.map((d) => {
			if (typeof d === "string") return d.trim();
			if (typeof d === "object" && d && "id" in d) return String(d.id).trim();
			if (typeof d === "object" && d && "_text" in d) return String(d._text).trim();
			return "";
		}).filter(Boolean);
		if (typeof doc === "string") return [doc.trim()];
		if (typeof doc === "object" && doc && "id" in doc) return [String(doc.id).trim()];
		if (typeof doc === "object" && doc && "_text" in doc) return [String(doc._text).trim()];
		return [];
	}
	/**
	* Parse item elements from a section.
	*
	* @param section - The section containing item elements.
	* @returns Array of item text strings.
	*/
	function parseItems(section) {
		if (!section) return [];
		const sectionObj = section;
		const item = sectionObj.item;
		if (Array.isArray(item)) return item.map((i$2) => extractText(i$2)).filter(Boolean);
		if (item !== void 0 && item !== null) {
			const text = extractText(item);
			return text ? [text] : [];
		}
		return [];
	}
	/**
	* Parse requirement elements with id and text content.
	*
	* @param section - The section containing requirement elements.
	* @returns Array of requirement objects with id and text.
	*/
	function parseRequirements(section) {
		if (!section) return [];
		const sectionObj = section;
		const req = sectionObj.requirement;
		if (!req) return [];
		const reqList = Array.isArray(req) ? req : [req];
		return reqList.map((r) => {
			if (typeof r === "object" && r) {
				const rObj = r;
				return {
					id: String(rObj.id || "").trim(),
					text: extractText(r)
				};
			}
			return {
				id: "",
				text: extractText(r)
			};
		}).filter((r) => r.id || r.text);
	}
	/**
	* Parse task ref elements from a tasks section.
	*
	* @param section - The section containing task elements.
	* @returns Array of task ref strings.
	*/
	function parseTaskRefs(section) {
		if (!section) return [];
		const sectionObj = section;
		const task = sectionObj.task;
		if (Array.isArray(task)) return task.map((t) => {
			if (typeof t === "string") return t.trim();
			if (typeof t === "object" && t && "ref" in t) return String(t.ref).trim();
			if (typeof t === "object" && t && "_text" in t) return String(t._text).trim();
			return "";
		}).filter(Boolean);
		if (typeof task === "string") return [task.trim()];
		if (typeof task === "object" && task && "ref" in task) return [String(task.ref).trim()];
		if (typeof task === "object" && task && "_text" in task) return [String(task._text).trim()];
		return [];
	}
	/**
	* Parse acceptance criteria elements into a single string.
	*
	* @param section - The section containing criterion elements.
	* @returns Concatenated acceptance criteria string.
	*/
	function parseAcceptanceCriteria(section) {
		if (!section) return "";
		if (typeof section === "string") return section.trim();
		const sectionObj = section;
		const criterion = sectionObj.criterion;
		if (!criterion) return extractText(section);
		if (Array.isArray(criterion)) return criterion.map((c) => extractText(c)).filter(Boolean).join("\n");
		return extractText(criterion);
	}
	/**
	* Parse req ref elements from a project-requirements section.
	*
	* @param section - The section containing req elements.
	* @returns Array of requirement ref strings.
	*/
	function parseReqRefs(section) {
		if (!section) return [];
		const sectionObj = section;
		const req = sectionObj.req;
		if (Array.isArray(req)) return req.map((r) => {
			if (typeof r === "string") return r.trim();
			if (typeof r === "object" && r && "ref" in r) return String(r.ref).trim();
			if (typeof r === "object" && r && "_text" in r) return String(r._text).trim();
			return "";
		}).filter(Boolean);
		if (typeof req === "string") return [req.trim()];
		if (typeof req === "object" && req && "ref" in req) return [String(req.ref).trim()];
		if (typeof req === "object" && req && "_text" in req) return [String(req._text).trim()];
		return [];
	}
	/**
	* Parse a project.xml file into structured metadata.
	*
	* @param content - The XML content to parse.
	* @returns Parsed project metadata.
	*/
	function parseProjectXml(content) {
		const result = parser.parse(content);
		const project = result.project;
		return {
			id: project.id || "",
			status: project.status || "open",
			title: extractText(project.title),
			description: extractText(project.description),
			problem: extractText(project.problem),
			value: extractText(project.value),
			scope: {
				inScope: parseItems(project.scope?.["in-scope"]),
				outOfScope: parseItems(project.scope?.["out-of-scope"])
			},
			requirements: parseRequirements(project.requirements),
			acceptanceCriteria: parseAcceptanceCriteria(project["acceptance-criteria"]),
			tasks: parseTaskRefs(project.tasks),
			notes: extractText(project.notes),
			affects: parseDocIds(project.affects),
			engineering: parseDocIds(project.engineering),
			created: project.created || "",
			updated: project.updated || ""
		};
	}
	function parseTaskXml(content) {
		const result = parser.parse(content);
		const task = result.task;
		const projectId = task["project-id"] ? String(task["project-id"]).trim() : void 0;
		const projectRequirements = task["project-requirements"] ? parseReqRefs(task["project-requirements"]) : void 0;
		return {
			id: task.id || "",
			status: task.status || "",
			priority: task.priority || "",
			title: task.title || "",
			description: task.description || "",
			labels: Array.isArray(task.labels?.label) ? task.labels.label : task.labels?.label ? [task.labels.label] : [],
			affects: parseRefs(task.affects),
			engineering: parseRefs(task.engineering),
			created: task.created || "",
			updated: task.updated || "",
			...projectId !== void 0 ? { projectId } : {},
			...projectRequirements !== void 0 ? { projectRequirements } : {}
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
	function validateXml(content) {
		parser.parse(content);
		return true;
	}
	/**
	* Parse context file elements from a task.
	*/
	function parseContextFiles(context) {
		if (!context) return [];
		const contextObj = context;
		const file = contextObj.file;
		if (Array.isArray(file)) return file.map((f) => {
			if (typeof f === "string") return f.trim();
			if (typeof f === "object" && f && "_text" in f) return String(f._text).trim();
			return "";
		}).filter(Boolean);
		if (typeof file === "string") return [file.trim()];
		if (typeof file === "object" && file && "_text" in file) return [String(file._text).trim()];
		return [];
	}
	/**
	* Extract text content from an element.
	*/
	function extractText(element) {
		if (typeof element === "string") return element.trim();
		if (typeof element === "object" && element && "_text" in element) return String(element._text).trim();
		return "";
	}
	function parsePlanTask(content, taskId) {
		const result = parser.parse(content);
		const plan = result.plan;
		const tasks = plan.tasks?.task;
		if (!tasks) return null;
		const taskList = Array.isArray(tasks) ? tasks : [tasks];
		const found = taskList.find((t) => String(t.id) === taskId);
		if (!found) return null;
		return {
			taskId: String(found.id || ""),
			name: extractText(found.name),
			files: extractText(found.files),
			requirements: extractText(found.requirements),
			pattern: extractText(found.pattern),
			context: parseContextFiles(found.context),
			action: extractText(found.action),
			verify: extractText(found.verify),
			done: extractText(found.done),
			completed: found.completed === "true" || found.completed === true
		};
	}
	function parsePlanTaskContext(content, taskId) {
		const result = parser.parse(content);
		const plan = result.plan;
		const tasks = plan.tasks?.task;
		if (!tasks) return null;
		const taskList = Array.isArray(tasks) ? tasks : [tasks];
		const found = taskList.find((t) => String(t.id) === taskId);
		if (!found) return null;
		return {
			taskId: String(found.id || ""),
			files: parseContextFiles(found.context)
		};
	}
	return {
		parseProjectXml,
		parseTaskXml,
		parseSpecXml,
		parsePlanXml,
		parseQuickXml,
		validateXml,
		parsePlanTask,
		parsePlanTaskContext
	};
}

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@4.1.1/node_modules/js-yaml/dist/js-yaml.mjs
/*! js-yaml 4.1.1 https://github.com/nodeca/js-yaml @license MIT */
function isNothing$1(subject) {
	return typeof subject === "undefined" || subject === null;
}
function isObject$2(subject) {
	return typeof subject === "object" && subject !== null;
}
function toArray$1(sequence) {
	if (Array.isArray(sequence)) return sequence;
	else if (isNothing$1(sequence)) return [];
	return [sequence];
}
function extend$2(target, source) {
	var index, length, key, sourceKeys;
	if (source) {
		sourceKeys = Object.keys(source);
		for (index = 0, length = sourceKeys.length; index < length; index += 1) {
			key = sourceKeys[index];
			target[key] = source[key];
		}
	}
	return target;
}
function repeat$1(string, count) {
	var result = "", cycle;
	for (cycle = 0; cycle < count; cycle += 1) result += string;
	return result;
}
function isNegativeZero$1(number) {
	return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing$1;
var isObject_1 = isObject$2;
var toArray_1 = toArray$1;
var repeat_1 = repeat$1;
var isNegativeZero_1 = isNegativeZero$1;
var extend_1 = extend$2;
var common$6 = {
	isNothing: isNothing_1,
	isObject: isObject_1,
	toArray: toArray_1,
	repeat: repeat_1,
	isNegativeZero: isNegativeZero_1,
	extend: extend_1
};
function formatError(exception$1, compact) {
	var where = "", message = exception$1.reason || "(unknown reason)";
	if (!exception$1.mark) return message;
	if (exception$1.mark.name) where += "in \"" + exception$1.mark.name + "\" ";
	where += "(" + (exception$1.mark.line + 1) + ":" + (exception$1.mark.column + 1) + ")";
	if (!compact && exception$1.mark.snippet) where += "\n\n" + exception$1.mark.snippet;
	return message + " " + where;
}
function YAMLException$1$1(reason, mark) {
	Error.call(this);
	this.name = "YAMLException";
	this.reason = reason;
	this.mark = mark;
	this.message = formatError(this, false);
	if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
	else this.stack = new Error().stack || "";
}
YAMLException$1$1.prototype = Object.create(Error.prototype);
YAMLException$1$1.prototype.constructor = YAMLException$1$1;
YAMLException$1$1.prototype.toString = function toString$1(compact) {
	return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
	var head = "";
	var tail = "";
	var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
	if (position - lineStart > maxHalfLength) {
		head = " ... ";
		lineStart = position - maxHalfLength + head.length;
	}
	if (lineEnd - position > maxHalfLength) {
		tail = " ...";
		lineEnd = position + maxHalfLength - tail.length;
	}
	return {
		str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
		pos: position - lineStart + head.length
	};
}
function padStart(string, max) {
	return common$6.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
	options = Object.create(options || null);
	if (!mark.buffer) return null;
	if (!options.maxLength) options.maxLength = 79;
	if (typeof options.indent !== "number") options.indent = 1;
	if (typeof options.linesBefore !== "number") options.linesBefore = 3;
	if (typeof options.linesAfter !== "number") options.linesAfter = 2;
	var re = /\r?\n|\r|\0/g;
	var lineStarts = [0];
	var lineEnds = [];
	var match;
	var foundLineNo = -1;
	while (match = re.exec(mark.buffer)) {
		lineEnds.push(match.index);
		lineStarts.push(match.index + match[0].length);
		if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
	}
	if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
	var result = "", i$2, line;
	var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
	var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
	for (i$2 = 1; i$2 <= options.linesBefore; i$2++) {
		if (foundLineNo - i$2 < 0) break;
		line = getLine(mark.buffer, lineStarts[foundLineNo - i$2], lineEnds[foundLineNo - i$2], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i$2]), maxLineLength);
		result = common$6.repeat(" ", options.indent) + padStart((mark.line - i$2 + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
	}
	line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
	result += common$6.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
	result += common$6.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
	for (i$2 = 1; i$2 <= options.linesAfter; i$2++) {
		if (foundLineNo + i$2 >= lineEnds.length) break;
		line = getLine(mark.buffer, lineStarts[foundLineNo + i$2], lineEnds[foundLineNo + i$2], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i$2]), maxLineLength);
		result += common$6.repeat(" ", options.indent) + padStart((mark.line + i$2 + 1).toString(), lineNoLength) + " | " + line.str + "\n";
	}
	return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS$1 = [
	"kind",
	"multi",
	"resolve",
	"construct",
	"instanceOf",
	"predicate",
	"represent",
	"representName",
	"defaultStyle",
	"styleAliases"
];
var YAML_NODE_KINDS$1 = [
	"scalar",
	"sequence",
	"mapping"
];
function compileStyleAliases$1(map$1) {
	var result = {};
	if (map$1 !== null) Object.keys(map$1).forEach(function(style) {
		map$1[style].forEach(function(alias) {
			result[String(alias)] = style;
		});
	});
	return result;
}
function Type$1$1(tag, options) {
	options = options || {};
	Object.keys(options).forEach(function(name) {
		if (TYPE_CONSTRUCTOR_OPTIONS$1.indexOf(name) === -1) throw new exception("Unknown option \"" + name + "\" is met in definition of \"" + tag + "\" YAML type.");
	});
	this.options = options;
	this.tag = tag;
	this.kind = options["kind"] || null;
	this.resolve = options["resolve"] || function() {
		return true;
	};
	this.construct = options["construct"] || function(data) {
		return data;
	};
	this.instanceOf = options["instanceOf"] || null;
	this.predicate = options["predicate"] || null;
	this.represent = options["represent"] || null;
	this.representName = options["representName"] || null;
	this.defaultStyle = options["defaultStyle"] || null;
	this.multi = options["multi"] || false;
	this.styleAliases = compileStyleAliases$1(options["styleAliases"] || null);
	if (YAML_NODE_KINDS$1.indexOf(this.kind) === -1) throw new exception("Unknown kind \"" + this.kind + "\" is specified for \"" + tag + "\" YAML type.");
}
var type = Type$1$1;
function compileList$1(schema$1, name) {
	var result = [];
	schema$1[name].forEach(function(currentType) {
		var newIndex = result.length;
		result.forEach(function(previousType, previousIndex) {
			if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) newIndex = previousIndex;
		});
		result[newIndex] = currentType;
	});
	return result;
}
function compileMap$1() {
	var result = {
		scalar: {},
		sequence: {},
		mapping: {},
		fallback: {},
		multi: {
			scalar: [],
			sequence: [],
			mapping: [],
			fallback: []
		}
	}, index, length;
	function collectType(type$1) {
		if (type$1.multi) {
			result.multi[type$1.kind].push(type$1);
			result.multi["fallback"].push(type$1);
		} else result[type$1.kind][type$1.tag] = result["fallback"][type$1.tag] = type$1;
	}
	for (index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
	return result;
}
function Schema$1$1(definition) {
	return this.extend(definition);
}
Schema$1$1.prototype.extend = function extend$3(definition) {
	var implicit = [];
	var explicit = [];
	if (definition instanceof type) explicit.push(definition);
	else if (Array.isArray(definition)) explicit = explicit.concat(definition);
	else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
		if (definition.implicit) implicit = implicit.concat(definition.implicit);
		if (definition.explicit) explicit = explicit.concat(definition.explicit);
	} else throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
	implicit.forEach(function(type$1) {
		if (!(type$1 instanceof type)) throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		if (type$1.loadKind && type$1.loadKind !== "scalar") throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
		if (type$1.multi) throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
	});
	explicit.forEach(function(type$1) {
		if (!(type$1 instanceof type)) throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
	});
	var result = Object.create(Schema$1$1.prototype);
	result.implicit = (this.implicit || []).concat(implicit);
	result.explicit = (this.explicit || []).concat(explicit);
	result.compiledImplicit = compileList$1(result, "implicit");
	result.compiledExplicit = compileList$1(result, "explicit");
	result.compiledTypeMap = compileMap$1(result.compiledImplicit, result.compiledExplicit);
	return result;
};
var schema = Schema$1$1;
var str = new type("tag:yaml.org,2002:str", {
	kind: "scalar",
	construct: function(data) {
		return data !== null ? data : "";
	}
});
var seq = new type("tag:yaml.org,2002:seq", {
	kind: "sequence",
	construct: function(data) {
		return data !== null ? data : [];
	}
});
var map = new type("tag:yaml.org,2002:map", {
	kind: "mapping",
	construct: function(data) {
		return data !== null ? data : {};
	}
});
var failsafe = new schema({ explicit: [
	str,
	seq,
	map
] });
function resolveYamlNull$1(data) {
	if (data === null) return true;
	var max = data.length;
	return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull$1() {
	return null;
}
function isNull$1(object) {
	return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
	kind: "scalar",
	resolve: resolveYamlNull$1,
	construct: constructYamlNull$1,
	predicate: isNull$1,
	represent: {
		canonical: function() {
			return "~";
		},
		lowercase: function() {
			return "null";
		},
		uppercase: function() {
			return "NULL";
		},
		camelcase: function() {
			return "Null";
		},
		empty: function() {
			return "";
		}
	},
	defaultStyle: "lowercase"
});
function resolveYamlBoolean$1(data) {
	if (data === null) return false;
	var max = data.length;
	return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean$1(data) {
	return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean$1(object) {
	return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
	kind: "scalar",
	resolve: resolveYamlBoolean$1,
	construct: constructYamlBoolean$1,
	predicate: isBoolean$1,
	represent: {
		lowercase: function(object) {
			return object ? "true" : "false";
		},
		uppercase: function(object) {
			return object ? "TRUE" : "FALSE";
		},
		camelcase: function(object) {
			return object ? "True" : "False";
		}
	},
	defaultStyle: "lowercase"
});
function isHexCode$1(c) {
	return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode$1(c) {
	return 48 <= c && c <= 55;
}
function isDecCode$1(c) {
	return 48 <= c && c <= 57;
}
function resolveYamlInteger$1(data) {
	if (data === null) return false;
	var max = data.length, index = 0, hasDigits = false, ch;
	if (!max) return false;
	ch = data[index];
	if (ch === "-" || ch === "+") ch = data[++index];
	if (ch === "0") {
		if (index + 1 === max) return true;
		ch = data[++index];
		if (ch === "b") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (ch !== "0" && ch !== "1") return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
		if (ch === "x") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (!isHexCode$1(data.charCodeAt(index))) return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
		if (ch === "o") {
			index++;
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (!isOctCode$1(data.charCodeAt(index))) return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
	}
	if (ch === "_") return false;
	for (; index < max; index++) {
		ch = data[index];
		if (ch === "_") continue;
		if (!isDecCode$1(data.charCodeAt(index))) return false;
		hasDigits = true;
	}
	if (!hasDigits || ch === "_") return false;
	return true;
}
function constructYamlInteger$1(data) {
	var value = data, sign = 1, ch;
	if (value.indexOf("_") !== -1) value = value.replace(/_/g, "");
	ch = value[0];
	if (ch === "-" || ch === "+") {
		if (ch === "-") sign = -1;
		value = value.slice(1);
		ch = value[0];
	}
	if (value === "0") return 0;
	if (ch === "0") {
		if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
		if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
		if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
	}
	return sign * parseInt(value, 10);
}
function isInteger$1(object) {
	return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common$6.isNegativeZero(object);
}
var int = new type("tag:yaml.org,2002:int", {
	kind: "scalar",
	resolve: resolveYamlInteger$1,
	construct: constructYamlInteger$1,
	predicate: isInteger$1,
	represent: {
		binary: function(obj) {
			return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
		},
		octal: function(obj) {
			return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
		},
		decimal: function(obj) {
			return obj.toString(10);
		},
		hexadecimal: function(obj) {
			return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
		}
	},
	defaultStyle: "decimal",
	styleAliases: {
		binary: [2, "bin"],
		octal: [8, "oct"],
		decimal: [10, "dec"],
		hexadecimal: [16, "hex"]
	}
});
var YAML_FLOAT_PATTERN$1 = new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$1(data) {
	if (data === null) return false;
	if (!YAML_FLOAT_PATTERN$1.test(data) || data[data.length - 1] === "_") return false;
	return true;
}
function constructYamlFloat$1(data) {
	var value, sign;
	value = data.replace(/_/g, "").toLowerCase();
	sign = value[0] === "-" ? -1 : 1;
	if ("+-".indexOf(value[0]) >= 0) value = value.slice(1);
	if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	else if (value === ".nan") return NaN;
	return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT$1 = /^[-+]?[0-9]+e/;
function representYamlFloat$1(object, style) {
	var res;
	if (isNaN(object)) switch (style) {
		case "lowercase": return ".nan";
		case "uppercase": return ".NAN";
		case "camelcase": return ".NaN";
	}
	else if (Number.POSITIVE_INFINITY === object) switch (style) {
		case "lowercase": return ".inf";
		case "uppercase": return ".INF";
		case "camelcase": return ".Inf";
	}
	else if (Number.NEGATIVE_INFINITY === object) switch (style) {
		case "lowercase": return "-.inf";
		case "uppercase": return "-.INF";
		case "camelcase": return "-.Inf";
	}
	else if (common$6.isNegativeZero(object)) return "-0.0";
	res = object.toString(10);
	return SCIENTIFIC_WITHOUT_DOT$1.test(res) ? res.replace("e", ".e") : res;
}
function isFloat$1(object) {
	return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common$6.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
	kind: "scalar",
	resolve: resolveYamlFloat$1,
	construct: constructYamlFloat$1,
	predicate: isFloat$1,
	represent: representYamlFloat$1,
	defaultStyle: "lowercase"
});
var json = failsafe.extend({ implicit: [
	_null,
	bool,
	int,
	float
] });
var core = json;
var YAML_DATE_REGEXP$1 = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP$1 = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
function resolveYamlTimestamp$1(data) {
	if (data === null) return false;
	if (YAML_DATE_REGEXP$1.exec(data) !== null) return true;
	if (YAML_TIMESTAMP_REGEXP$1.exec(data) !== null) return true;
	return false;
}
function constructYamlTimestamp$1(data) {
	var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
	match = YAML_DATE_REGEXP$1.exec(data);
	if (match === null) match = YAML_TIMESTAMP_REGEXP$1.exec(data);
	if (match === null) throw new Error("Date resolve error");
	year = +match[1];
	month = +match[2] - 1;
	day = +match[3];
	if (!match[4]) return new Date(Date.UTC(year, month, day));
	hour = +match[4];
	minute = +match[5];
	second = +match[6];
	if (match[7]) {
		fraction = match[7].slice(0, 3);
		while (fraction.length < 3) fraction += "0";
		fraction = +fraction;
	}
	if (match[9]) {
		tz_hour = +match[10];
		tz_minute = +(match[11] || 0);
		delta = (tz_hour * 60 + tz_minute) * 6e4;
		if (match[9] === "-") delta = -delta;
	}
	date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
	if (delta) date.setTime(date.getTime() - delta);
	return date;
}
function representYamlTimestamp$1(object) {
	return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
	kind: "scalar",
	resolve: resolveYamlTimestamp$1,
	construct: constructYamlTimestamp$1,
	instanceOf: Date,
	represent: representYamlTimestamp$1
});
function resolveYamlMerge$1(data) {
	return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
	kind: "scalar",
	resolve: resolveYamlMerge$1
});
var BASE64_MAP$1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary$1(data) {
	if (data === null) return false;
	var code, idx, bitlen = 0, max = data.length, map$1 = BASE64_MAP$1;
	for (idx = 0; idx < max; idx++) {
		code = map$1.indexOf(data.charAt(idx));
		if (code > 64) continue;
		if (code < 0) return false;
		bitlen += 6;
	}
	return bitlen % 8 === 0;
}
function constructYamlBinary$1(data) {
	var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map$1 = BASE64_MAP$1, bits = 0, result = [];
	for (idx = 0; idx < max; idx++) {
		if (idx % 4 === 0 && idx) {
			result.push(bits >> 16 & 255);
			result.push(bits >> 8 & 255);
			result.push(bits & 255);
		}
		bits = bits << 6 | map$1.indexOf(input.charAt(idx));
	}
	tailbits = max % 4 * 6;
	if (tailbits === 0) {
		result.push(bits >> 16 & 255);
		result.push(bits >> 8 & 255);
		result.push(bits & 255);
	} else if (tailbits === 18) {
		result.push(bits >> 10 & 255);
		result.push(bits >> 2 & 255);
	} else if (tailbits === 12) result.push(bits >> 4 & 255);
	return new Uint8Array(result);
}
function representYamlBinary$1(object) {
	var result = "", bits = 0, idx, tail, max = object.length, map$1 = BASE64_MAP$1;
	for (idx = 0; idx < max; idx++) {
		if (idx % 3 === 0 && idx) {
			result += map$1[bits >> 18 & 63];
			result += map$1[bits >> 12 & 63];
			result += map$1[bits >> 6 & 63];
			result += map$1[bits & 63];
		}
		bits = (bits << 8) + object[idx];
	}
	tail = max % 3;
	if (tail === 0) {
		result += map$1[bits >> 18 & 63];
		result += map$1[bits >> 12 & 63];
		result += map$1[bits >> 6 & 63];
		result += map$1[bits & 63];
	} else if (tail === 2) {
		result += map$1[bits >> 10 & 63];
		result += map$1[bits >> 4 & 63];
		result += map$1[bits << 2 & 63];
		result += map$1[64];
	} else if (tail === 1) {
		result += map$1[bits >> 2 & 63];
		result += map$1[bits << 4 & 63];
		result += map$1[64];
		result += map$1[64];
	}
	return result;
}
function isBinary$1(obj) {
	return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
	kind: "scalar",
	resolve: resolveYamlBinary$1,
	construct: constructYamlBinary$1,
	predicate: isBinary$1,
	represent: representYamlBinary$1
});
var _hasOwnProperty$3$1 = Object.prototype.hasOwnProperty;
var _toString$2$1 = Object.prototype.toString;
function resolveYamlOmap$1(data) {
	if (data === null) return true;
	var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		pairHasKey = false;
		if (_toString$2$1.call(pair) !== "[object Object]") return false;
		for (pairKey in pair) if (_hasOwnProperty$3$1.call(pair, pairKey)) if (!pairHasKey) pairHasKey = true;
		else return false;
		if (!pairHasKey) return false;
		if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
		else return false;
	}
	return true;
}
function constructYamlOmap$1(data) {
	return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
	kind: "sequence",
	resolve: resolveYamlOmap$1,
	construct: constructYamlOmap$1
});
var _toString$1$1 = Object.prototype.toString;
function resolveYamlPairs$1(data) {
	if (data === null) return true;
	var index, length, pair, keys, result, object = data;
	result = new Array(object.length);
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		if (_toString$1$1.call(pair) !== "[object Object]") return false;
		keys = Object.keys(pair);
		if (keys.length !== 1) return false;
		result[index] = [keys[0], pair[keys[0]]];
	}
	return true;
}
function constructYamlPairs$1(data) {
	if (data === null) return [];
	var index, length, pair, keys, result, object = data;
	result = new Array(object.length);
	for (index = 0, length = object.length; index < length; index += 1) {
		pair = object[index];
		keys = Object.keys(pair);
		result[index] = [keys[0], pair[keys[0]]];
	}
	return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
	kind: "sequence",
	resolve: resolveYamlPairs$1,
	construct: constructYamlPairs$1
});
var _hasOwnProperty$2$1 = Object.prototype.hasOwnProperty;
function resolveYamlSet$1(data) {
	if (data === null) return true;
	var key, object = data;
	for (key in object) if (_hasOwnProperty$2$1.call(object, key)) {
		if (object[key] !== null) return false;
	}
	return true;
}
function constructYamlSet$1(data) {
	return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
	kind: "mapping",
	resolve: resolveYamlSet$1,
	construct: constructYamlSet$1
});
var _default = core.extend({
	implicit: [timestamp, merge],
	explicit: [
		binary,
		omap,
		pairs,
		set
	]
});
var _hasOwnProperty$1$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN$1 = 1;
var CONTEXT_FLOW_OUT$1 = 2;
var CONTEXT_BLOCK_IN$1 = 3;
var CONTEXT_BLOCK_OUT$1 = 4;
var CHOMPING_CLIP$1 = 1;
var CHOMPING_STRIP$1 = 2;
var CHOMPING_KEEP$1 = 3;
var PATTERN_NON_PRINTABLE$1 = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS$1 = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS$1 = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE$1 = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI$1 = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class$1(obj) {
	return Object.prototype.toString.call(obj);
}
function is_EOL$1(c) {
	return c === 10 || c === 13;
}
function is_WHITE_SPACE$1(c) {
	return c === 9 || c === 32;
}
function is_WS_OR_EOL$1(c) {
	return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR$1(c) {
	return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode$1(c) {
	var lc;
	if (48 <= c && c <= 57) return c - 48;
	lc = c | 32;
	if (97 <= lc && lc <= 102) return lc - 97 + 10;
	return -1;
}
function escapedHexLen$1(c) {
	if (c === 120) return 2;
	if (c === 117) return 4;
	if (c === 85) return 8;
	return 0;
}
function fromDecimalCode$1(c) {
	if (48 <= c && c <= 57) return c - 48;
	return -1;
}
function simpleEscapeSequence$1(c) {
	return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? "\"" : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint$1(c) {
	if (c <= 65535) return String.fromCharCode(c);
	return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function setProperty$1(object, key, value) {
	if (key === "__proto__") Object.defineProperty(object, key, {
		configurable: true,
		enumerable: true,
		writable: true,
		value
	});
	else object[key] = value;
}
var simpleEscapeCheck$1 = new Array(256);
var simpleEscapeMap$1 = new Array(256);
for (var i$1 = 0; i$1 < 256; i$1++) {
	simpleEscapeCheck$1[i$1] = simpleEscapeSequence$1(i$1) ? 1 : 0;
	simpleEscapeMap$1[i$1] = simpleEscapeSequence$1(i$1);
}
function State$1$1(input, options) {
	this.input = input;
	this.filename = options["filename"] || null;
	this.schema = options["schema"] || _default;
	this.onWarning = options["onWarning"] || null;
	this.legacy = options["legacy"] || false;
	this.json = options["json"] || false;
	this.listener = options["listener"] || null;
	this.implicitTypes = this.schema.compiledImplicit;
	this.typeMap = this.schema.compiledTypeMap;
	this.length = input.length;
	this.position = 0;
	this.line = 0;
	this.lineStart = 0;
	this.lineIndent = 0;
	this.firstTabInLine = -1;
	this.documents = [];
}
function generateError$1(state, message) {
	var mark = {
		name: state.filename,
		buffer: state.input.slice(0, -1),
		position: state.position,
		line: state.line,
		column: state.position - state.lineStart
	};
	mark.snippet = snippet(mark);
	return new exception(message, mark);
}
function throwError$1(state, message) {
	throw generateError$1(state, message);
}
function throwWarning$1(state, message) {
	if (state.onWarning) state.onWarning.call(null, generateError$1(state, message));
}
var directiveHandlers$1 = {
	YAML: function handleYamlDirective(state, name, args) {
		var match, major, minor;
		if (state.version !== null) throwError$1(state, "duplication of %YAML directive");
		if (args.length !== 1) throwError$1(state, "YAML directive accepts exactly one argument");
		match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
		if (match === null) throwError$1(state, "ill-formed argument of the YAML directive");
		major = parseInt(match[1], 10);
		minor = parseInt(match[2], 10);
		if (major !== 1) throwError$1(state, "unacceptable YAML version of the document");
		state.version = args[0];
		state.checkLineBreaks = minor < 2;
		if (minor !== 1 && minor !== 2) throwWarning$1(state, "unsupported YAML version of the document");
	},
	TAG: function handleTagDirective(state, name, args) {
		var handle, prefix;
		if (args.length !== 2) throwError$1(state, "TAG directive accepts exactly two arguments");
		handle = args[0];
		prefix = args[1];
		if (!PATTERN_TAG_HANDLE$1.test(handle)) throwError$1(state, "ill-formed tag handle (first argument) of the TAG directive");
		if (_hasOwnProperty$1$1.call(state.tagMap, handle)) throwError$1(state, "there is a previously declared suffix for \"" + handle + "\" tag handle");
		if (!PATTERN_TAG_URI$1.test(prefix)) throwError$1(state, "ill-formed tag prefix (second argument) of the TAG directive");
		try {
			prefix = decodeURIComponent(prefix);
		} catch (err$1) {
			throwError$1(state, "tag prefix is malformed: " + prefix);
		}
		state.tagMap[handle] = prefix;
	}
};
function captureSegment$1(state, start, end, checkJson) {
	var _position, _length, _character, _result;
	if (start < end) {
		_result = state.input.slice(start, end);
		if (checkJson) for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
			_character = _result.charCodeAt(_position);
			if (!(_character === 9 || 32 <= _character && _character <= 1114111)) throwError$1(state, "expected valid JSON character");
		}
		else if (PATTERN_NON_PRINTABLE$1.test(_result)) throwError$1(state, "the stream contains non-printable characters");
		state.result += _result;
	}
}
function mergeMappings$1(state, destination, source, overridableKeys) {
	var sourceKeys, key, index, quantity;
	if (!common$6.isObject(source)) throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
	sourceKeys = Object.keys(source);
	for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
		key = sourceKeys[index];
		if (!_hasOwnProperty$1$1.call(destination, key)) {
			setProperty$1(destination, key, source[key]);
			overridableKeys[key] = true;
		}
	}
}
function storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
	var index, quantity;
	if (Array.isArray(keyNode)) {
		keyNode = Array.prototype.slice.call(keyNode);
		for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
			if (Array.isArray(keyNode[index])) throwError$1(state, "nested arrays are not supported inside keys");
			if (typeof keyNode === "object" && _class$1(keyNode[index]) === "[object Object]") keyNode[index] = "[object Object]";
		}
	}
	if (typeof keyNode === "object" && _class$1(keyNode) === "[object Object]") keyNode = "[object Object]";
	keyNode = String(keyNode);
	if (_result === null) _result = {};
	if (keyTag === "tag:yaml.org,2002:merge") if (Array.isArray(valueNode)) for (index = 0, quantity = valueNode.length; index < quantity; index += 1) mergeMappings$1(state, _result, valueNode[index], overridableKeys);
	else mergeMappings$1(state, _result, valueNode, overridableKeys);
	else {
		if (!state.json && !_hasOwnProperty$1$1.call(overridableKeys, keyNode) && _hasOwnProperty$1$1.call(_result, keyNode)) {
			state.line = startLine || state.line;
			state.lineStart = startLineStart || state.lineStart;
			state.position = startPos || state.position;
			throwError$1(state, "duplicated mapping key");
		}
		setProperty$1(_result, keyNode, valueNode);
		delete overridableKeys[keyNode];
	}
	return _result;
}
function readLineBreak$1(state) {
	var ch;
	ch = state.input.charCodeAt(state.position);
	if (ch === 10) state.position++;
	else if (ch === 13) {
		state.position++;
		if (state.input.charCodeAt(state.position) === 10) state.position++;
	} else throwError$1(state, "a line break is expected");
	state.line += 1;
	state.lineStart = state.position;
	state.firstTabInLine = -1;
}
function skipSeparationSpace$1(state, allowComments, checkIndent) {
	var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		while (is_WHITE_SPACE$1(ch)) {
			if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
			ch = state.input.charCodeAt(++state.position);
		}
		if (allowComments && ch === 35) do
			ch = state.input.charCodeAt(++state.position);
		while (ch !== 10 && ch !== 13 && ch !== 0);
		if (is_EOL$1(ch)) {
			readLineBreak$1(state);
			ch = state.input.charCodeAt(state.position);
			lineBreaks++;
			state.lineIndent = 0;
			while (ch === 32) {
				state.lineIndent++;
				ch = state.input.charCodeAt(++state.position);
			}
		} else break;
	}
	if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) throwWarning$1(state, "deficient indentation");
	return lineBreaks;
}
function testDocumentSeparator$1(state) {
	var _position = state.position, ch;
	ch = state.input.charCodeAt(_position);
	if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
		_position += 3;
		ch = state.input.charCodeAt(_position);
		if (ch === 0 || is_WS_OR_EOL$1(ch)) return true;
	}
	return false;
}
function writeFoldedLines$1(state, count) {
	if (count === 1) state.result += " ";
	else if (count > 1) state.result += common$6.repeat("\n", count - 1);
}
function readPlainScalar$1(state, nodeIndent, withinFlowCollection) {
	var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
	ch = state.input.charCodeAt(state.position);
	if (is_WS_OR_EOL$1(ch) || is_FLOW_INDICATOR$1(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) return false;
	if (ch === 63 || ch === 45) {
		following = state.input.charCodeAt(state.position + 1);
		if (is_WS_OR_EOL$1(following) || withinFlowCollection && is_FLOW_INDICATOR$1(following)) return false;
	}
	state.kind = "scalar";
	state.result = "";
	captureStart = captureEnd = state.position;
	hasPendingContent = false;
	while (ch !== 0) {
		if (ch === 58) {
			following = state.input.charCodeAt(state.position + 1);
			if (is_WS_OR_EOL$1(following) || withinFlowCollection && is_FLOW_INDICATOR$1(following)) break;
		} else if (ch === 35) {
			preceding = state.input.charCodeAt(state.position - 1);
			if (is_WS_OR_EOL$1(preceding)) break;
		} else if (state.position === state.lineStart && testDocumentSeparator$1(state) || withinFlowCollection && is_FLOW_INDICATOR$1(ch)) break;
		else if (is_EOL$1(ch)) {
			_line = state.line;
			_lineStart = state.lineStart;
			_lineIndent = state.lineIndent;
			skipSeparationSpace$1(state, false, -1);
			if (state.lineIndent >= nodeIndent) {
				hasPendingContent = true;
				ch = state.input.charCodeAt(state.position);
				continue;
			} else {
				state.position = captureEnd;
				state.line = _line;
				state.lineStart = _lineStart;
				state.lineIndent = _lineIndent;
				break;
			}
		}
		if (hasPendingContent) {
			captureSegment$1(state, captureStart, captureEnd, false);
			writeFoldedLines$1(state, state.line - _line);
			captureStart = captureEnd = state.position;
			hasPendingContent = false;
		}
		if (!is_WHITE_SPACE$1(ch)) captureEnd = state.position + 1;
		ch = state.input.charCodeAt(++state.position);
	}
	captureSegment$1(state, captureStart, captureEnd, false);
	if (state.result) return true;
	state.kind = _kind;
	state.result = _result;
	return false;
}
function readSingleQuotedScalar$1(state, nodeIndent) {
	var ch, captureStart, captureEnd;
	ch = state.input.charCodeAt(state.position);
	if (ch !== 39) return false;
	state.kind = "scalar";
	state.result = "";
	state.position++;
	captureStart = captureEnd = state.position;
	while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 39) {
		captureSegment$1(state, captureStart, state.position, true);
		ch = state.input.charCodeAt(++state.position);
		if (ch === 39) {
			captureStart = state.position;
			state.position++;
			captureEnd = state.position;
		} else return true;
	} else if (is_EOL$1(ch)) {
		captureSegment$1(state, captureStart, captureEnd, true);
		writeFoldedLines$1(state, skipSeparationSpace$1(state, false, nodeIndent));
		captureStart = captureEnd = state.position;
	} else if (state.position === state.lineStart && testDocumentSeparator$1(state)) throwError$1(state, "unexpected end of the document within a single quoted scalar");
	else {
		state.position++;
		captureEnd = state.position;
	}
	throwError$1(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar$1(state, nodeIndent) {
	var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch !== 34) return false;
	state.kind = "scalar";
	state.result = "";
	state.position++;
	captureStart = captureEnd = state.position;
	while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 34) {
		captureSegment$1(state, captureStart, state.position, true);
		state.position++;
		return true;
	} else if (ch === 92) {
		captureSegment$1(state, captureStart, state.position, true);
		ch = state.input.charCodeAt(++state.position);
		if (is_EOL$1(ch)) skipSeparationSpace$1(state, false, nodeIndent);
		else if (ch < 256 && simpleEscapeCheck$1[ch]) {
			state.result += simpleEscapeMap$1[ch];
			state.position++;
		} else if ((tmp = escapedHexLen$1(ch)) > 0) {
			hexLength = tmp;
			hexResult = 0;
			for (; hexLength > 0; hexLength--) {
				ch = state.input.charCodeAt(++state.position);
				if ((tmp = fromHexCode$1(ch)) >= 0) hexResult = (hexResult << 4) + tmp;
				else throwError$1(state, "expected hexadecimal character");
			}
			state.result += charFromCodepoint$1(hexResult);
			state.position++;
		} else throwError$1(state, "unknown escape sequence");
		captureStart = captureEnd = state.position;
	} else if (is_EOL$1(ch)) {
		captureSegment$1(state, captureStart, captureEnd, true);
		writeFoldedLines$1(state, skipSeparationSpace$1(state, false, nodeIndent));
		captureStart = captureEnd = state.position;
	} else if (state.position === state.lineStart && testDocumentSeparator$1(state)) throwError$1(state, "unexpected end of the document within a double quoted scalar");
	else {
		state.position++;
		captureEnd = state.position;
	}
	throwError$1(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection$1(state, nodeIndent) {
	var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = Object.create(null), keyNode, keyTag, valueNode, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch === 91) {
		terminator = 93;
		isMapping = false;
		_result = [];
	} else if (ch === 123) {
		terminator = 125;
		isMapping = true;
		_result = {};
	} else return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(++state.position);
	while (ch !== 0) {
		skipSeparationSpace$1(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if (ch === terminator) {
			state.position++;
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = isMapping ? "mapping" : "sequence";
			state.result = _result;
			return true;
		} else if (!readNext) throwError$1(state, "missed comma between flow collection entries");
		else if (ch === 44) throwError$1(state, "expected the node content, but found ','");
		keyTag = keyNode = valueNode = null;
		isPair = isExplicitPair = false;
		if (ch === 63) {
			following = state.input.charCodeAt(state.position + 1);
			if (is_WS_OR_EOL$1(following)) {
				isPair = isExplicitPair = true;
				state.position++;
				skipSeparationSpace$1(state, true, nodeIndent);
			}
		}
		_line = state.line;
		_lineStart = state.lineStart;
		_pos = state.position;
		composeNode$1(state, nodeIndent, CONTEXT_FLOW_IN$1, false, true);
		keyTag = state.tag;
		keyNode = state.result;
		skipSeparationSpace$1(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if ((isExplicitPair || state.line === _line) && ch === 58) {
			isPair = true;
			ch = state.input.charCodeAt(++state.position);
			skipSeparationSpace$1(state, true, nodeIndent);
			composeNode$1(state, nodeIndent, CONTEXT_FLOW_IN$1, false, true);
			valueNode = state.result;
		}
		if (isMapping) storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
		else if (isPair) _result.push(storeMappingPair$1(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
		else _result.push(keyNode);
		skipSeparationSpace$1(state, true, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if (ch === 44) {
			readNext = true;
			ch = state.input.charCodeAt(++state.position);
		} else readNext = false;
	}
	throwError$1(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar$1(state, nodeIndent) {
	var captureStart, folding, chomping = CHOMPING_CLIP$1, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch === 124) folding = false;
	else if (ch === 62) folding = true;
	else return false;
	state.kind = "scalar";
	state.result = "";
	while (ch !== 0) {
		ch = state.input.charCodeAt(++state.position);
		if (ch === 43 || ch === 45) if (CHOMPING_CLIP$1 === chomping) chomping = ch === 43 ? CHOMPING_KEEP$1 : CHOMPING_STRIP$1;
		else throwError$1(state, "repeat of a chomping mode identifier");
		else if ((tmp = fromDecimalCode$1(ch)) >= 0) if (tmp === 0) throwError$1(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
		else if (!detectedIndent) {
			textIndent = nodeIndent + tmp - 1;
			detectedIndent = true;
		} else throwError$1(state, "repeat of an indentation width identifier");
		else break;
	}
	if (is_WHITE_SPACE$1(ch)) {
		do
			ch = state.input.charCodeAt(++state.position);
		while (is_WHITE_SPACE$1(ch));
		if (ch === 35) do
			ch = state.input.charCodeAt(++state.position);
		while (!is_EOL$1(ch) && ch !== 0);
	}
	while (ch !== 0) {
		readLineBreak$1(state);
		state.lineIndent = 0;
		ch = state.input.charCodeAt(state.position);
		while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
			state.lineIndent++;
			ch = state.input.charCodeAt(++state.position);
		}
		if (!detectedIndent && state.lineIndent > textIndent) textIndent = state.lineIndent;
		if (is_EOL$1(ch)) {
			emptyLines++;
			continue;
		}
		if (state.lineIndent < textIndent) {
			if (chomping === CHOMPING_KEEP$1) state.result += common$6.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			else if (chomping === CHOMPING_CLIP$1) {
				if (didReadContent) state.result += "\n";
			}
			break;
		}
		if (folding) if (is_WHITE_SPACE$1(ch)) {
			atMoreIndented = true;
			state.result += common$6.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
		} else if (atMoreIndented) {
			atMoreIndented = false;
			state.result += common$6.repeat("\n", emptyLines + 1);
		} else if (emptyLines === 0) {
			if (didReadContent) state.result += " ";
		} else state.result += common$6.repeat("\n", emptyLines);
		else state.result += common$6.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
		didReadContent = true;
		detectedIndent = true;
		emptyLines = 0;
		captureStart = state.position;
		while (!is_EOL$1(ch) && ch !== 0) ch = state.input.charCodeAt(++state.position);
		captureSegment$1(state, captureStart, state.position, false);
	}
	return true;
}
function readBlockSequence$1(state, nodeIndent) {
	var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
	if (state.firstTabInLine !== -1) return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		if (state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError$1(state, "tab characters must not be used in indentation");
		}
		if (ch !== 45) break;
		following = state.input.charCodeAt(state.position + 1);
		if (!is_WS_OR_EOL$1(following)) break;
		detected = true;
		state.position++;
		if (skipSeparationSpace$1(state, true, -1)) {
			if (state.lineIndent <= nodeIndent) {
				_result.push(null);
				ch = state.input.charCodeAt(state.position);
				continue;
			}
		}
		_line = state.line;
		composeNode$1(state, nodeIndent, CONTEXT_BLOCK_IN$1, false, true);
		_result.push(state.result);
		skipSeparationSpace$1(state, true, -1);
		ch = state.input.charCodeAt(state.position);
		if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError$1(state, "bad indentation of a sequence entry");
		else if (state.lineIndent < nodeIndent) break;
	}
	if (detected) {
		state.tag = _tag;
		state.anchor = _anchor;
		state.kind = "sequence";
		state.result = _result;
		return true;
	}
	return false;
}
function readBlockMapping$1(state, nodeIndent, flowIndent) {
	var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
	if (state.firstTabInLine !== -1) return false;
	if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
	ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		if (!atExplicitKey && state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError$1(state, "tab characters must not be used in indentation");
		}
		following = state.input.charCodeAt(state.position + 1);
		_line = state.line;
		if ((ch === 63 || ch === 58) && is_WS_OR_EOL$1(following)) {
			if (ch === 63) {
				if (atExplicitKey) {
					storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
					keyTag = keyNode = valueNode = null;
				}
				detected = true;
				atExplicitKey = true;
				allowCompact = true;
			} else if (atExplicitKey) {
				atExplicitKey = false;
				allowCompact = true;
			} else throwError$1(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
			state.position += 1;
			ch = following;
		} else {
			_keyLine = state.line;
			_keyLineStart = state.lineStart;
			_keyPos = state.position;
			if (!composeNode$1(state, flowIndent, CONTEXT_FLOW_OUT$1, false, true)) break;
			if (state.line === _line) {
				ch = state.input.charCodeAt(state.position);
				while (is_WHITE_SPACE$1(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 58) {
					ch = state.input.charCodeAt(++state.position);
					if (!is_WS_OR_EOL$1(ch)) throwError$1(state, "a whitespace character is expected after the key-value separator within a block mapping");
					if (atExplicitKey) {
						storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = false;
					allowCompact = false;
					keyTag = state.tag;
					keyNode = state.result;
				} else if (detected) throwError$1(state, "can not read an implicit mapping pair; a colon is missed");
				else {
					state.tag = _tag;
					state.anchor = _anchor;
					return true;
				}
			} else if (detected) throwError$1(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
			else {
				state.tag = _tag;
				state.anchor = _anchor;
				return true;
			}
		}
		if (state.line === _line || state.lineIndent > nodeIndent) {
			if (atExplicitKey) {
				_keyLine = state.line;
				_keyLineStart = state.lineStart;
				_keyPos = state.position;
			}
			if (composeNode$1(state, nodeIndent, CONTEXT_BLOCK_OUT$1, true, allowCompact)) if (atExplicitKey) keyNode = state.result;
			else valueNode = state.result;
			if (!atExplicitKey) {
				storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
				keyTag = keyNode = valueNode = null;
			}
			skipSeparationSpace$1(state, true, -1);
			ch = state.input.charCodeAt(state.position);
		}
		if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError$1(state, "bad indentation of a mapping entry");
		else if (state.lineIndent < nodeIndent) break;
	}
	if (atExplicitKey) storeMappingPair$1(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
	if (detected) {
		state.tag = _tag;
		state.anchor = _anchor;
		state.kind = "mapping";
		state.result = _result;
	}
	return detected;
}
function readTagProperty$1(state) {
	var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch !== 33) return false;
	if (state.tag !== null) throwError$1(state, "duplication of a tag property");
	ch = state.input.charCodeAt(++state.position);
	if (ch === 60) {
		isVerbatim = true;
		ch = state.input.charCodeAt(++state.position);
	} else if (ch === 33) {
		isNamed = true;
		tagHandle = "!!";
		ch = state.input.charCodeAt(++state.position);
	} else tagHandle = "!";
	_position = state.position;
	if (isVerbatim) {
		do
			ch = state.input.charCodeAt(++state.position);
		while (ch !== 0 && ch !== 62);
		if (state.position < state.length) {
			tagName = state.input.slice(_position, state.position);
			ch = state.input.charCodeAt(++state.position);
		} else throwError$1(state, "unexpected end of the stream within a verbatim tag");
	} else {
		while (ch !== 0 && !is_WS_OR_EOL$1(ch)) {
			if (ch === 33) if (!isNamed) {
				tagHandle = state.input.slice(_position - 1, state.position + 1);
				if (!PATTERN_TAG_HANDLE$1.test(tagHandle)) throwError$1(state, "named tag handle cannot contain such characters");
				isNamed = true;
				_position = state.position + 1;
			} else throwError$1(state, "tag suffix cannot contain exclamation marks");
			ch = state.input.charCodeAt(++state.position);
		}
		tagName = state.input.slice(_position, state.position);
		if (PATTERN_FLOW_INDICATORS$1.test(tagName)) throwError$1(state, "tag suffix cannot contain flow indicator characters");
	}
	if (tagName && !PATTERN_TAG_URI$1.test(tagName)) throwError$1(state, "tag name cannot contain such characters: " + tagName);
	try {
		tagName = decodeURIComponent(tagName);
	} catch (err$1) {
		throwError$1(state, "tag name is malformed: " + tagName);
	}
	if (isVerbatim) state.tag = tagName;
	else if (_hasOwnProperty$1$1.call(state.tagMap, tagHandle)) state.tag = state.tagMap[tagHandle] + tagName;
	else if (tagHandle === "!") state.tag = "!" + tagName;
	else if (tagHandle === "!!") state.tag = "tag:yaml.org,2002:" + tagName;
	else throwError$1(state, "undeclared tag handle \"" + tagHandle + "\"");
	return true;
}
function readAnchorProperty$1(state) {
	var _position, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch !== 38) return false;
	if (state.anchor !== null) throwError$1(state, "duplication of an anchor property");
	ch = state.input.charCodeAt(++state.position);
	_position = state.position;
	while (ch !== 0 && !is_WS_OR_EOL$1(ch) && !is_FLOW_INDICATOR$1(ch)) ch = state.input.charCodeAt(++state.position);
	if (state.position === _position) throwError$1(state, "name of an anchor node must contain at least one character");
	state.anchor = state.input.slice(_position, state.position);
	return true;
}
function readAlias$1(state) {
	var _position, alias, ch;
	ch = state.input.charCodeAt(state.position);
	if (ch !== 42) return false;
	ch = state.input.charCodeAt(++state.position);
	_position = state.position;
	while (ch !== 0 && !is_WS_OR_EOL$1(ch) && !is_FLOW_INDICATOR$1(ch)) ch = state.input.charCodeAt(++state.position);
	if (state.position === _position) throwError$1(state, "name of an alias node must contain at least one character");
	alias = state.input.slice(_position, state.position);
	if (!_hasOwnProperty$1$1.call(state.anchorMap, alias)) throwError$1(state, "unidentified alias \"" + alias + "\"");
	state.result = state.anchorMap[alias];
	skipSeparationSpace$1(state, true, -1);
	return true;
}
function composeNode$1(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
	var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type$1, flowIndent, blockIndent;
	if (state.listener !== null) state.listener("open", state);
	state.tag = null;
	state.anchor = null;
	state.kind = null;
	state.result = null;
	allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT$1 === nodeContext || CONTEXT_BLOCK_IN$1 === nodeContext;
	if (allowToSeek) {
		if (skipSeparationSpace$1(state, true, -1)) {
			atNewLine = true;
			if (state.lineIndent > parentIndent) indentStatus = 1;
			else if (state.lineIndent === parentIndent) indentStatus = 0;
			else if (state.lineIndent < parentIndent) indentStatus = -1;
		}
	}
	if (indentStatus === 1) while (readTagProperty$1(state) || readAnchorProperty$1(state)) if (skipSeparationSpace$1(state, true, -1)) {
		atNewLine = true;
		allowBlockCollections = allowBlockStyles;
		if (state.lineIndent > parentIndent) indentStatus = 1;
		else if (state.lineIndent === parentIndent) indentStatus = 0;
		else if (state.lineIndent < parentIndent) indentStatus = -1;
	} else allowBlockCollections = false;
	if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
	if (indentStatus === 1 || CONTEXT_BLOCK_OUT$1 === nodeContext) {
		if (CONTEXT_FLOW_IN$1 === nodeContext || CONTEXT_FLOW_OUT$1 === nodeContext) flowIndent = parentIndent;
		else flowIndent = parentIndent + 1;
		blockIndent = state.position - state.lineStart;
		if (indentStatus === 1) if (allowBlockCollections && (readBlockSequence$1(state, blockIndent) || readBlockMapping$1(state, blockIndent, flowIndent)) || readFlowCollection$1(state, flowIndent)) hasContent = true;
		else {
			if (allowBlockScalars && readBlockScalar$1(state, flowIndent) || readSingleQuotedScalar$1(state, flowIndent) || readDoubleQuotedScalar$1(state, flowIndent)) hasContent = true;
			else if (readAlias$1(state)) {
				hasContent = true;
				if (state.tag !== null || state.anchor !== null) throwError$1(state, "alias node should not have any properties");
			} else if (readPlainScalar$1(state, flowIndent, CONTEXT_FLOW_IN$1 === nodeContext)) {
				hasContent = true;
				if (state.tag === null) state.tag = "?";
			}
			if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
		}
		else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence$1(state, blockIndent);
	}
	if (state.tag === null) {
		if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
	} else if (state.tag === "?") {
		if (state.result !== null && state.kind !== "scalar") throwError$1(state, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + state.kind + "\"");
		for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
			type$1 = state.implicitTypes[typeIndex];
			if (type$1.resolve(state.result)) {
				state.result = type$1.construct(state.result);
				state.tag = type$1.tag;
				if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
				break;
			}
		}
	} else if (state.tag !== "!") {
		if (_hasOwnProperty$1$1.call(state.typeMap[state.kind || "fallback"], state.tag)) type$1 = state.typeMap[state.kind || "fallback"][state.tag];
		else {
			type$1 = null;
			typeList = state.typeMap.multi[state.kind || "fallback"];
			for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
				type$1 = typeList[typeIndex];
				break;
			}
		}
		if (!type$1) throwError$1(state, "unknown tag !<" + state.tag + ">");
		if (state.result !== null && type$1.kind !== state.kind) throwError$1(state, "unacceptable node kind for !<" + state.tag + "> tag; it should be \"" + type$1.kind + "\", not \"" + state.kind + "\"");
		if (!type$1.resolve(state.result, state.tag)) throwError$1(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
		else {
			state.result = type$1.construct(state.result, state.tag);
			if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
		}
	}
	if (state.listener !== null) state.listener("close", state);
	return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument$1(state) {
	var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
	state.version = null;
	state.checkLineBreaks = state.legacy;
	state.tagMap = Object.create(null);
	state.anchorMap = Object.create(null);
	while ((ch = state.input.charCodeAt(state.position)) !== 0) {
		skipSeparationSpace$1(state, true, -1);
		ch = state.input.charCodeAt(state.position);
		if (state.lineIndent > 0 || ch !== 37) break;
		hasDirectives = true;
		ch = state.input.charCodeAt(++state.position);
		_position = state.position;
		while (ch !== 0 && !is_WS_OR_EOL$1(ch)) ch = state.input.charCodeAt(++state.position);
		directiveName = state.input.slice(_position, state.position);
		directiveArgs = [];
		if (directiveName.length < 1) throwError$1(state, "directive name must not be less than one character in length");
		while (ch !== 0) {
			while (is_WHITE_SPACE$1(ch)) ch = state.input.charCodeAt(++state.position);
			if (ch === 35) {
				do
					ch = state.input.charCodeAt(++state.position);
				while (ch !== 0 && !is_EOL$1(ch));
				break;
			}
			if (is_EOL$1(ch)) break;
			_position = state.position;
			while (ch !== 0 && !is_WS_OR_EOL$1(ch)) ch = state.input.charCodeAt(++state.position);
			directiveArgs.push(state.input.slice(_position, state.position));
		}
		if (ch !== 0) readLineBreak$1(state);
		if (_hasOwnProperty$1$1.call(directiveHandlers$1, directiveName)) directiveHandlers$1[directiveName](state, directiveName, directiveArgs);
		else throwWarning$1(state, "unknown document directive \"" + directiveName + "\"");
	}
	skipSeparationSpace$1(state, true, -1);
	if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
		state.position += 3;
		skipSeparationSpace$1(state, true, -1);
	} else if (hasDirectives) throwError$1(state, "directives end mark is expected");
	composeNode$1(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT$1, false, true);
	skipSeparationSpace$1(state, true, -1);
	if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS$1.test(state.input.slice(documentStart, state.position))) throwWarning$1(state, "non-ASCII line breaks are interpreted as content");
	state.documents.push(state.result);
	if (state.position === state.lineStart && testDocumentSeparator$1(state)) {
		if (state.input.charCodeAt(state.position) === 46) {
			state.position += 3;
			skipSeparationSpace$1(state, true, -1);
		}
		return;
	}
	if (state.position < state.length - 1) throwError$1(state, "end of the stream or a document separator is expected");
	else return;
}
function loadDocuments$1(input, options) {
	input = String(input);
	options = options || {};
	if (input.length !== 0) {
		if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) input += "\n";
		if (input.charCodeAt(0) === 65279) input = input.slice(1);
	}
	var state = new State$1$1(input, options);
	var nullpos = input.indexOf("\0");
	if (nullpos !== -1) {
		state.position = nullpos;
		throwError$1(state, "null byte is not allowed in input");
	}
	state.input += "\0";
	while (state.input.charCodeAt(state.position) === 32) {
		state.lineIndent += 1;
		state.position += 1;
	}
	while (state.position < state.length - 1) readDocument$1(state);
	return state.documents;
}
function loadAll$1(input, iterator, options) {
	if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
		options = iterator;
		iterator = null;
	}
	var documents = loadDocuments$1(input, options);
	if (typeof iterator !== "function") return documents;
	for (var index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
}
function load$1(input, options) {
	var documents = loadDocuments$1(input, options);
	if (documents.length === 0) return void 0;
	else if (documents.length === 1) return documents[0];
	throw new exception("expected a single document in the stream, but found more");
}
var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader$1 = {
	loadAll: loadAll_1,
	load: load_1
};
var _toString$3 = Object.prototype.toString;
var _hasOwnProperty$4 = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB$1 = 9;
var CHAR_LINE_FEED$1 = 10;
var CHAR_CARRIAGE_RETURN$1 = 13;
var CHAR_SPACE$1 = 32;
var CHAR_EXCLAMATION$1 = 33;
var CHAR_DOUBLE_QUOTE$1 = 34;
var CHAR_SHARP$1 = 35;
var CHAR_PERCENT$1 = 37;
var CHAR_AMPERSAND$1 = 38;
var CHAR_SINGLE_QUOTE$1 = 39;
var CHAR_ASTERISK$1 = 42;
var CHAR_COMMA$1 = 44;
var CHAR_MINUS$1 = 45;
var CHAR_COLON$1 = 58;
var CHAR_EQUALS$1 = 61;
var CHAR_GREATER_THAN$1 = 62;
var CHAR_QUESTION$1 = 63;
var CHAR_COMMERCIAL_AT$1 = 64;
var CHAR_LEFT_SQUARE_BRACKET$1 = 91;
var CHAR_RIGHT_SQUARE_BRACKET$1 = 93;
var CHAR_GRAVE_ACCENT$1 = 96;
var CHAR_LEFT_CURLY_BRACKET$1 = 123;
var CHAR_VERTICAL_LINE$1 = 124;
var CHAR_RIGHT_CURLY_BRACKET$1 = 125;
var ESCAPE_SEQUENCES$1 = {};
ESCAPE_SEQUENCES$1[0] = "\\0";
ESCAPE_SEQUENCES$1[7] = "\\a";
ESCAPE_SEQUENCES$1[8] = "\\b";
ESCAPE_SEQUENCES$1[9] = "\\t";
ESCAPE_SEQUENCES$1[10] = "\\n";
ESCAPE_SEQUENCES$1[11] = "\\v";
ESCAPE_SEQUENCES$1[12] = "\\f";
ESCAPE_SEQUENCES$1[13] = "\\r";
ESCAPE_SEQUENCES$1[27] = "\\e";
ESCAPE_SEQUENCES$1[34] = "\\\"";
ESCAPE_SEQUENCES$1[92] = "\\\\";
ESCAPE_SEQUENCES$1[133] = "\\N";
ESCAPE_SEQUENCES$1[160] = "\\_";
ESCAPE_SEQUENCES$1[8232] = "\\L";
ESCAPE_SEQUENCES$1[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX$1 = [
	"y",
	"Y",
	"yes",
	"Yes",
	"YES",
	"on",
	"On",
	"ON",
	"n",
	"N",
	"no",
	"No",
	"NO",
	"off",
	"Off",
	"OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap$1(schema$1, map$1) {
	var result, keys, index, length, tag, style, type$1;
	if (map$1 === null) return {};
	result = {};
	keys = Object.keys(map$1);
	for (index = 0, length = keys.length; index < length; index += 1) {
		tag = keys[index];
		style = String(map$1[tag]);
		if (tag.slice(0, 2) === "!!") tag = "tag:yaml.org,2002:" + tag.slice(2);
		type$1 = schema$1.compiledTypeMap["fallback"][tag];
		if (type$1 && _hasOwnProperty$4.call(type$1.styleAliases, style)) style = type$1.styleAliases[style];
		result[tag] = style;
	}
	return result;
}
function encodeHex$1(character) {
	var string, handle, length;
	string = character.toString(16).toUpperCase();
	if (character <= 255) {
		handle = "x";
		length = 2;
	} else if (character <= 65535) {
		handle = "u";
		length = 4;
	} else if (character <= 4294967295) {
		handle = "U";
		length = 8;
	} else throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
	return "\\" + handle + common$6.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1, QUOTING_TYPE_DOUBLE = 2;
function State$2(options) {
	this.schema = options["schema"] || _default;
	this.indent = Math.max(1, options["indent"] || 2);
	this.noArrayIndent = options["noArrayIndent"] || false;
	this.skipInvalid = options["skipInvalid"] || false;
	this.flowLevel = common$6.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
	this.styleMap = compileStyleMap$1(this.schema, options["styles"] || null);
	this.sortKeys = options["sortKeys"] || false;
	this.lineWidth = options["lineWidth"] || 80;
	this.noRefs = options["noRefs"] || false;
	this.noCompatMode = options["noCompatMode"] || false;
	this.condenseFlow = options["condenseFlow"] || false;
	this.quotingType = options["quotingType"] === "\"" ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
	this.forceQuotes = options["forceQuotes"] || false;
	this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
	this.implicitTypes = this.schema.compiledImplicit;
	this.explicitTypes = this.schema.compiledExplicit;
	this.tag = null;
	this.result = "";
	this.duplicates = [];
	this.usedDuplicates = null;
}
function indentString$1(string, spaces) {
	var ind = common$6.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
	while (position < length) {
		next = string.indexOf("\n", position);
		if (next === -1) {
			line = string.slice(position);
			position = length;
		} else {
			line = string.slice(position, next + 1);
			position = next + 1;
		}
		if (line.length && line !== "\n") result += ind;
		result += line;
	}
	return result;
}
function generateNextLine$1(state, level) {
	return "\n" + common$6.repeat(" ", state.indent * level);
}
function testImplicitResolving$1(state, str$1) {
	var index, length, type$1;
	for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
		type$1 = state.implicitTypes[index];
		if (type$1.resolve(str$1)) return true;
	}
	return false;
}
function isWhitespace$1(c) {
	return c === CHAR_SPACE$1 || c === CHAR_TAB$1;
}
function isPrintable$1(c) {
	return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
	return isPrintable$1(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN$1 && c !== CHAR_LINE_FEED$1;
}
function isPlainSafe$1(c, prev, inblock) {
	var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
	var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace$1(c);
	return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA$1 && c !== CHAR_LEFT_SQUARE_BRACKET$1 && c !== CHAR_RIGHT_SQUARE_BRACKET$1 && c !== CHAR_LEFT_CURLY_BRACKET$1 && c !== CHAR_RIGHT_CURLY_BRACKET$1) && c !== CHAR_SHARP$1 && !(prev === CHAR_COLON$1 && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace$1(prev) && c === CHAR_SHARP$1 || prev === CHAR_COLON$1 && cIsNsChar;
}
function isPlainSafeFirst$1(c) {
	return isPrintable$1(c) && c !== CHAR_BOM && !isWhitespace$1(c) && c !== CHAR_MINUS$1 && c !== CHAR_QUESTION$1 && c !== CHAR_COLON$1 && c !== CHAR_COMMA$1 && c !== CHAR_LEFT_SQUARE_BRACKET$1 && c !== CHAR_RIGHT_SQUARE_BRACKET$1 && c !== CHAR_LEFT_CURLY_BRACKET$1 && c !== CHAR_RIGHT_CURLY_BRACKET$1 && c !== CHAR_SHARP$1 && c !== CHAR_AMPERSAND$1 && c !== CHAR_ASTERISK$1 && c !== CHAR_EXCLAMATION$1 && c !== CHAR_VERTICAL_LINE$1 && c !== CHAR_EQUALS$1 && c !== CHAR_GREATER_THAN$1 && c !== CHAR_SINGLE_QUOTE$1 && c !== CHAR_DOUBLE_QUOTE$1 && c !== CHAR_PERCENT$1 && c !== CHAR_COMMERCIAL_AT$1 && c !== CHAR_GRAVE_ACCENT$1;
}
function isPlainSafeLast(c) {
	return !isWhitespace$1(c) && c !== CHAR_COLON$1;
}
function codePointAt(string, pos) {
	var first = string.charCodeAt(pos), second;
	if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
		second = string.charCodeAt(pos + 1);
		if (second >= 56320 && second <= 57343) return (first - 55296) * 1024 + second - 56320 + 65536;
	}
	return first;
}
function needIndentIndicator$1(string) {
	var leadingSpaceRe = /^\n* /;
	return leadingSpaceRe.test(string);
}
var STYLE_PLAIN$1 = 1, STYLE_SINGLE$1 = 2, STYLE_LITERAL$1 = 3, STYLE_FOLDED$1 = 4, STYLE_DOUBLE$1 = 5;
function chooseScalarStyle$1(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
	var i$2;
	var char = 0;
	var prevChar = null;
	var hasLineBreak = false;
	var hasFoldableLine = false;
	var shouldTrackWidth = lineWidth !== -1;
	var previousLineBreak = -1;
	var plain = isPlainSafeFirst$1(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
	if (singleLineOnly || forceQuotes) for (i$2 = 0; i$2 < string.length; char >= 65536 ? i$2 += 2 : i$2++) {
		char = codePointAt(string, i$2);
		if (!isPrintable$1(char)) return STYLE_DOUBLE$1;
		plain = plain && isPlainSafe$1(char, prevChar, inblock);
		prevChar = char;
	}
	else {
		for (i$2 = 0; i$2 < string.length; char >= 65536 ? i$2 += 2 : i$2++) {
			char = codePointAt(string, i$2);
			if (char === CHAR_LINE_FEED$1) {
				hasLineBreak = true;
				if (shouldTrackWidth) {
					hasFoldableLine = hasFoldableLine || i$2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
					previousLineBreak = i$2;
				}
			} else if (!isPrintable$1(char)) return STYLE_DOUBLE$1;
			plain = plain && isPlainSafe$1(char, prevChar, inblock);
			prevChar = char;
		}
		hasFoldableLine = hasFoldableLine || shouldTrackWidth && i$2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
	}
	if (!hasLineBreak && !hasFoldableLine) {
		if (plain && !forceQuotes && !testAmbiguousType(string)) return STYLE_PLAIN$1;
		return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE$1 : STYLE_SINGLE$1;
	}
	if (indentPerLevel > 9 && needIndentIndicator$1(string)) return STYLE_DOUBLE$1;
	if (!forceQuotes) return hasFoldableLine ? STYLE_FOLDED$1 : STYLE_LITERAL$1;
	return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE$1 : STYLE_SINGLE$1;
}
function writeScalar$1(state, string, level, iskey, inblock) {
	state.dump = function() {
		if (string.length === 0) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"\"" : "''";
		if (!state.noCompatMode) {
			if (DEPRECATED_BOOLEANS_SYNTAX$1.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"" + string + "\"" : "'" + string + "'";
		}
		var indent = state.indent * Math.max(1, level);
		var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
		var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
		function testAmbiguity(string$1) {
			return testImplicitResolving$1(state, string$1);
		}
		switch (chooseScalarStyle$1(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
			case STYLE_PLAIN$1: return string;
			case STYLE_SINGLE$1: return "'" + string.replace(/'/g, "''") + "'";
			case STYLE_LITERAL$1: return "|" + blockHeader$1(string, state.indent) + dropEndingNewline$1(indentString$1(string, indent));
			case STYLE_FOLDED$1: return ">" + blockHeader$1(string, state.indent) + dropEndingNewline$1(indentString$1(foldString$1(string, lineWidth), indent));
			case STYLE_DOUBLE$1: return "\"" + escapeString$1(string) + "\"";
			default: throw new exception("impossible error: invalid scalar style");
		}
	}();
}
function blockHeader$1(string, indentPerLevel) {
	var indentIndicator = needIndentIndicator$1(string) ? String(indentPerLevel) : "";
	var clip = string[string.length - 1] === "\n";
	var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
	var chomp = keep ? "+" : clip ? "" : "-";
	return indentIndicator + chomp + "\n";
}
function dropEndingNewline$1(string) {
	return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString$1(string, width) {
	var lineRe = /(\n+)([^\n]*)/g;
	var result = function() {
		var nextLF = string.indexOf("\n");
		nextLF = nextLF !== -1 ? nextLF : string.length;
		lineRe.lastIndex = nextLF;
		return foldLine$1(string.slice(0, nextLF), width);
	}();
	var prevMoreIndented = string[0] === "\n" || string[0] === " ";
	var moreIndented;
	var match;
	while (match = lineRe.exec(string)) {
		var prefix = match[1], line = match[2];
		moreIndented = line[0] === " ";
		result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine$1(line, width);
		prevMoreIndented = moreIndented;
	}
	return result;
}
function foldLine$1(line, width) {
	if (line === "" || line[0] === " ") return line;
	var breakRe = / [^ ]/g;
	var match;
	var start = 0, end, curr = 0, next = 0;
	var result = "";
	while (match = breakRe.exec(line)) {
		next = match.index;
		if (next - start > width) {
			end = curr > start ? curr : next;
			result += "\n" + line.slice(start, end);
			start = end + 1;
		}
		curr = next;
	}
	result += "\n";
	if (line.length - start > width && curr > start) result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
	else result += line.slice(start);
	return result.slice(1);
}
function escapeString$1(string) {
	var result = "";
	var char = 0;
	var escapeSeq;
	for (var i$2 = 0; i$2 < string.length; char >= 65536 ? i$2 += 2 : i$2++) {
		char = codePointAt(string, i$2);
		escapeSeq = ESCAPE_SEQUENCES$1[char];
		if (!escapeSeq && isPrintable$1(char)) {
			result += string[i$2];
			if (char >= 65536) result += string[i$2 + 1];
		} else result += escapeSeq || encodeHex$1(char);
	}
	return result;
}
function writeFlowSequence$1(state, level, object) {
	var _result = "", _tag = state.tag, index, length, value;
	for (index = 0, length = object.length; index < length; index += 1) {
		value = object[index];
		if (state.replacer) value = state.replacer.call(object, String(index), value);
		if (writeNode$1(state, level, value, false, false) || typeof value === "undefined" && writeNode$1(state, level, null, false, false)) {
			if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
			_result += state.dump;
		}
	}
	state.tag = _tag;
	state.dump = "[" + _result + "]";
}
function writeBlockSequence$1(state, level, object, compact) {
	var _result = "", _tag = state.tag, index, length, value;
	for (index = 0, length = object.length; index < length; index += 1) {
		value = object[index];
		if (state.replacer) value = state.replacer.call(object, String(index), value);
		if (writeNode$1(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode$1(state, level + 1, null, true, true, false, true)) {
			if (!compact || _result !== "") _result += generateNextLine$1(state, level);
			if (state.dump && CHAR_LINE_FEED$1 === state.dump.charCodeAt(0)) _result += "-";
			else _result += "- ";
			_result += state.dump;
		}
	}
	state.tag = _tag;
	state.dump = _result || "[]";
}
function writeFlowMapping$1(state, level, object) {
	var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
	for (index = 0, length = objectKeyList.length; index < length; index += 1) {
		pairBuffer = "";
		if (_result !== "") pairBuffer += ", ";
		if (state.condenseFlow) pairBuffer += "\"";
		objectKey = objectKeyList[index];
		objectValue = object[objectKey];
		if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
		if (!writeNode$1(state, level, objectKey, false, false)) continue;
		if (state.dump.length > 1024) pairBuffer += "? ";
		pairBuffer += state.dump + (state.condenseFlow ? "\"" : "") + ":" + (state.condenseFlow ? "" : " ");
		if (!writeNode$1(state, level, objectValue, false, false)) continue;
		pairBuffer += state.dump;
		_result += pairBuffer;
	}
	state.tag = _tag;
	state.dump = "{" + _result + "}";
}
function writeBlockMapping$1(state, level, object, compact) {
	var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
	if (state.sortKeys === true) objectKeyList.sort();
	else if (typeof state.sortKeys === "function") objectKeyList.sort(state.sortKeys);
	else if (state.sortKeys) throw new exception("sortKeys must be a boolean or a function");
	for (index = 0, length = objectKeyList.length; index < length; index += 1) {
		pairBuffer = "";
		if (!compact || _result !== "") pairBuffer += generateNextLine$1(state, level);
		objectKey = objectKeyList[index];
		objectValue = object[objectKey];
		if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
		if (!writeNode$1(state, level + 1, objectKey, true, true, true)) continue;
		explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
		if (explicitPair) if (state.dump && CHAR_LINE_FEED$1 === state.dump.charCodeAt(0)) pairBuffer += "?";
		else pairBuffer += "? ";
		pairBuffer += state.dump;
		if (explicitPair) pairBuffer += generateNextLine$1(state, level);
		if (!writeNode$1(state, level + 1, objectValue, true, explicitPair)) continue;
		if (state.dump && CHAR_LINE_FEED$1 === state.dump.charCodeAt(0)) pairBuffer += ":";
		else pairBuffer += ": ";
		pairBuffer += state.dump;
		_result += pairBuffer;
	}
	state.tag = _tag;
	state.dump = _result || "{}";
}
function detectType$1(state, object, explicit) {
	var _result, typeList, index, length, type$1, style;
	typeList = explicit ? state.explicitTypes : state.implicitTypes;
	for (index = 0, length = typeList.length; index < length; index += 1) {
		type$1 = typeList[index];
		if ((type$1.instanceOf || type$1.predicate) && (!type$1.instanceOf || typeof object === "object" && object instanceof type$1.instanceOf) && (!type$1.predicate || type$1.predicate(object))) {
			if (explicit) if (type$1.multi && type$1.representName) state.tag = type$1.representName(object);
			else state.tag = type$1.tag;
			else state.tag = "?";
			if (type$1.represent) {
				style = state.styleMap[type$1.tag] || type$1.defaultStyle;
				if (_toString$3.call(type$1.represent) === "[object Function]") _result = type$1.represent(object, style);
				else if (_hasOwnProperty$4.call(type$1.represent, style)) _result = type$1.represent[style](object, style);
				else throw new exception("!<" + type$1.tag + "> tag resolver accepts not \"" + style + "\" style");
				state.dump = _result;
			}
			return true;
		}
	}
	return false;
}
function writeNode$1(state, level, object, block, compact, iskey, isblockseq) {
	state.tag = null;
	state.dump = object;
	if (!detectType$1(state, object, false)) detectType$1(state, object, true);
	var type$1 = _toString$3.call(state.dump);
	var inblock = block;
	var tagStr;
	if (block) block = state.flowLevel < 0 || state.flowLevel > level;
	var objectOrArray = type$1 === "[object Object]" || type$1 === "[object Array]", duplicateIndex, duplicate;
	if (objectOrArray) {
		duplicateIndex = state.duplicates.indexOf(object);
		duplicate = duplicateIndex !== -1;
	}
	if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) compact = false;
	if (duplicate && state.usedDuplicates[duplicateIndex]) state.dump = "*ref_" + duplicateIndex;
	else {
		if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) state.usedDuplicates[duplicateIndex] = true;
		if (type$1 === "[object Object]") if (block && Object.keys(state.dump).length !== 0) {
			writeBlockMapping$1(state, level, state.dump, compact);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
		} else {
			writeFlowMapping$1(state, level, state.dump);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
		}
		else if (type$1 === "[object Array]") if (block && state.dump.length !== 0) {
			if (state.noArrayIndent && !isblockseq && level > 0) writeBlockSequence$1(state, level - 1, state.dump, compact);
			else writeBlockSequence$1(state, level, state.dump, compact);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
		} else {
			writeFlowSequence$1(state, level, state.dump);
			if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
		}
		else if (type$1 === "[object String]") {
			if (state.tag !== "?") writeScalar$1(state, state.dump, level, iskey, inblock);
		} else if (type$1 === "[object Undefined]") return false;
		else {
			if (state.skipInvalid) return false;
			throw new exception("unacceptable kind of an object to dump " + type$1);
		}
		if (state.tag !== null && state.tag !== "?") {
			tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
			if (state.tag[0] === "!") tagStr = "!" + tagStr;
			else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") tagStr = "!!" + tagStr.slice(18);
			else tagStr = "!<" + tagStr + ">";
			state.dump = tagStr + " " + state.dump;
		}
	}
	return true;
}
function getDuplicateReferences$1(object, state) {
	var objects = [], duplicatesIndexes = [], index, length;
	inspectNode$1(object, objects, duplicatesIndexes);
	for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) state.duplicates.push(objects[duplicatesIndexes[index]]);
	state.usedDuplicates = new Array(length);
}
function inspectNode$1(object, objects, duplicatesIndexes) {
	var objectKeyList, index, length;
	if (object !== null && typeof object === "object") {
		index = objects.indexOf(object);
		if (index !== -1) {
			if (duplicatesIndexes.indexOf(index) === -1) duplicatesIndexes.push(index);
		} else {
			objects.push(object);
			if (Array.isArray(object)) for (index = 0, length = object.length; index < length; index += 1) inspectNode$1(object[index], objects, duplicatesIndexes);
			else {
				objectKeyList = Object.keys(object);
				for (index = 0, length = objectKeyList.length; index < length; index += 1) inspectNode$1(object[objectKeyList[index]], objects, duplicatesIndexes);
			}
		}
	}
}
function dump$1(input, options) {
	options = options || {};
	var state = new State$2(options);
	if (!state.noRefs) getDuplicateReferences$1(input, state);
	var value = input;
	if (state.replacer) value = state.replacer.call({ "": value }, "", value);
	if (writeNode$1(state, 0, value, true, true)) return state.dump + "\n";
	return "";
}
var dump_1 = dump$1;
var dumper$1 = { dump: dump_1 };
function renamed(from, to) {
	return function() {
		throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
	};
}
var load$2 = loader$1.load;
var loadAll$2 = loader$1.loadAll;
var dump$2 = dumper$1.dump;
var safeLoad$1 = renamed("safeLoad", "load");
var safeLoadAll$1 = renamed("safeLoadAll", "loadAll");
var safeDump$1 = renamed("safeDump", "dump");

//#endregion
//#region ../../node_modules/.pnpm/kind-of@6.0.3/node_modules/kind-of/index.js
var require_kind_of = __commonJS({ "../../node_modules/.pnpm/kind-of@6.0.3/node_modules/kind-of/index.js"(exports, module) {
	var toString = Object.prototype.toString;
	module.exports = function kindOf(val) {
		if (val === void 0) return "undefined";
		if (val === null) return "null";
		var type$1 = typeof val;
		if (type$1 === "boolean") return "boolean";
		if (type$1 === "string") return "string";
		if (type$1 === "number") return "number";
		if (type$1 === "symbol") return "symbol";
		if (type$1 === "function") return isGeneratorFn(val) ? "generatorfunction" : "function";
		if (isArray(val)) return "array";
		if (isBuffer$1(val)) return "buffer";
		if (isArguments(val)) return "arguments";
		if (isDate(val)) return "date";
		if (isError(val)) return "error";
		if (isRegexp(val)) return "regexp";
		switch (ctorName(val)) {
			case "Symbol": return "symbol";
			case "Promise": return "promise";
			case "WeakMap": return "weakmap";
			case "WeakSet": return "weakset";
			case "Map": return "map";
			case "Set": return "set";
			case "Int8Array": return "int8array";
			case "Uint8Array": return "uint8array";
			case "Uint8ClampedArray": return "uint8clampedarray";
			case "Int16Array": return "int16array";
			case "Uint16Array": return "uint16array";
			case "Int32Array": return "int32array";
			case "Uint32Array": return "uint32array";
			case "Float32Array": return "float32array";
			case "Float64Array": return "float64array";
		}
		if (isGeneratorObj(val)) return "generator";
		type$1 = toString.call(val);
		switch (type$1) {
			case "[object Object]": return "object";
			case "[object Map Iterator]": return "mapiterator";
			case "[object Set Iterator]": return "setiterator";
			case "[object String Iterator]": return "stringiterator";
			case "[object Array Iterator]": return "arrayiterator";
		}
		return type$1.slice(8, -1).toLowerCase().replace(/\s/g, "");
	};
	function ctorName(val) {
		return typeof val.constructor === "function" ? val.constructor.name : null;
	}
	function isArray(val) {
		if (Array.isArray) return Array.isArray(val);
		return val instanceof Array;
	}
	function isError(val) {
		return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
	}
	function isDate(val) {
		if (val instanceof Date) return true;
		return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
	}
	function isRegexp(val) {
		if (val instanceof RegExp) return true;
		return typeof val.flags === "string" && typeof val.ignoreCase === "boolean" && typeof val.multiline === "boolean" && typeof val.global === "boolean";
	}
	function isGeneratorFn(name, val) {
		return ctorName(name) === "GeneratorFunction";
	}
	function isGeneratorObj(val) {
		return typeof val.throw === "function" && typeof val.return === "function" && typeof val.next === "function";
	}
	function isArguments(val) {
		try {
			if (typeof val.length === "number" && typeof val.callee === "function") return true;
		} catch (err$1) {
			if (err$1.message.indexOf("callee") !== -1) return true;
		}
		return false;
	}
	/**
	* If you need to support Safari 5-7 (8-10 yr-old browser),
	* take a look at https://github.com/feross/is-buffer
	*/
	function isBuffer$1(val) {
		if (val.constructor && typeof val.constructor.isBuffer === "function") return val.constructor.isBuffer(val);
		return false;
	}
} });

//#endregion
//#region ../../node_modules/.pnpm/is-extendable@0.1.1/node_modules/is-extendable/index.js
var require_is_extendable = __commonJS({ "../../node_modules/.pnpm/is-extendable@0.1.1/node_modules/is-extendable/index.js"(exports, module) {
	module.exports = function isExtendable(val) {
		return typeof val !== "undefined" && val !== null && (typeof val === "object" || typeof val === "function");
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/extend-shallow@2.0.1/node_modules/extend-shallow/index.js
var require_extend_shallow = __commonJS({ "../../node_modules/.pnpm/extend-shallow@2.0.1/node_modules/extend-shallow/index.js"(exports, module) {
	var isObject$1 = require_is_extendable();
	module.exports = function extend$3(o) {
		if (!isObject$1(o)) o = {};
		var len = arguments.length;
		for (var i$2 = 1; i$2 < len; i$2++) {
			var obj = arguments[i$2];
			if (isObject$1(obj)) assign(o, obj);
		}
		return o;
	};
	function assign(a, b) {
		for (var key in b) if (hasOwn(b, key)) a[key] = b[key];
	}
	/**
	* Returns true if the given `key` is an own property of `obj`.
	*/
	function hasOwn(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
} });

//#endregion
//#region ../../node_modules/.pnpm/section-matter@1.0.0/node_modules/section-matter/index.js
var require_section_matter = __commonJS({ "../../node_modules/.pnpm/section-matter@1.0.0/node_modules/section-matter/index.js"(exports, module) {
	var typeOf$3 = require_kind_of();
	var extend$1 = require_extend_shallow();
	/**
	* Parse sections in `input` with the given `options`.
	*
	* ```js
	* var sections = require('{%= name %}');
	* var result = sections(input, options);
	* // { content: 'Content before sections', sections: [] }
	* ```
	* @param {String|Buffer|Object} `input` If input is an object, it's `content` property must be a string or buffer.
	* @param {Object} options
	* @return {Object} Returns an object with a `content` string and an array of `sections` objects.
	* @api public
	*/
	module.exports = function(input, options) {
		if (typeof options === "function") options = { parse: options };
		var file = toObject(input);
		var defaults$4 = {
			section_delimiter: "---",
			parse: identity
		};
		var opts = extend$1({}, defaults$4, options);
		var delim = opts.section_delimiter;
		var lines = file.content.split(/\r?\n/);
		var sections$1 = null;
		var section = createSection();
		var content = [];
		var stack = [];
		function initSections(val) {
			file.content = val;
			sections$1 = [];
			content = [];
		}
		function closeSection(val) {
			if (stack.length) {
				section.key = getKey(stack[0], delim);
				section.content = val;
				opts.parse(section, sections$1);
				sections$1.push(section);
				section = createSection();
				content = [];
				stack = [];
			}
		}
		for (var i$2 = 0; i$2 < lines.length; i$2++) {
			var line = lines[i$2];
			var len = stack.length;
			var ln = line.trim();
			if (isDelimiter(ln, delim)) {
				if (ln.length === 3 && i$2 !== 0) {
					if (len === 0 || len === 2) {
						content.push(line);
						continue;
					}
					stack.push(ln);
					section.data = content.join("\n");
					content = [];
					continue;
				}
				if (sections$1 === null) initSections(content.join("\n"));
				if (len === 2) closeSection(content.join("\n"));
				stack.push(ln);
				continue;
			}
			content.push(line);
		}
		if (sections$1 === null) initSections(content.join("\n"));
		else closeSection(content.join("\n"));
		file.sections = sections$1;
		return file;
	};
	function isDelimiter(line, delim) {
		if (line.slice(0, delim.length) !== delim) return false;
		if (line.charAt(delim.length + 1) === delim.slice(-1)) return false;
		return true;
	}
	function toObject(input) {
		if (typeOf$3(input) !== "object") input = { content: input };
		if (typeof input.content !== "string" && !isBuffer(input.content)) throw new TypeError("expected a buffer or string");
		input.content = input.content.toString();
		input.sections = [];
		return input;
	}
	function getKey(val, delim) {
		return val ? val.slice(delim.length).trim() : "";
	}
	function createSection() {
		return {
			key: "",
			data: "",
			content: ""
		};
	}
	function identity(val) {
		return val;
	}
	function isBuffer(val) {
		if (val && val.constructor && typeof val.constructor.isBuffer === "function") return val.constructor.isBuffer(val);
		return false;
	}
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/common.js
var require_common = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/common.js"(exports, module) {
	function isNothing(subject) {
		return typeof subject === "undefined" || subject === null;
	}
	function isObject(subject) {
		return typeof subject === "object" && subject !== null;
	}
	function toArray(sequence) {
		if (Array.isArray(sequence)) return sequence;
		else if (isNothing(sequence)) return [];
		return [sequence];
	}
	function extend(target, source) {
		var index, length, key, sourceKeys;
		if (source) {
			sourceKeys = Object.keys(source);
			for (index = 0, length = sourceKeys.length; index < length; index += 1) {
				key = sourceKeys[index];
				target[key] = source[key];
			}
		}
		return target;
	}
	function repeat(string, count) {
		var result = "", cycle;
		for (cycle = 0; cycle < count; cycle += 1) result += string;
		return result;
	}
	function isNegativeZero(number) {
		return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
	}
	module.exports.isNothing = isNothing;
	module.exports.isObject = isObject;
	module.exports.toArray = toArray;
	module.exports.repeat = repeat;
	module.exports.isNegativeZero = isNegativeZero;
	module.exports.extend = extend;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/exception.js
var require_exception = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/exception.js"(exports, module) {
	function YAMLException$4(reason, mark) {
		Error.call(this);
		this.name = "YAMLException";
		this.reason = reason;
		this.mark = mark;
		this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : "");
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
		else this.stack = new Error().stack || "";
	}
	YAMLException$4.prototype = Object.create(Error.prototype);
	YAMLException$4.prototype.constructor = YAMLException$4;
	YAMLException$4.prototype.toString = function toString$1(compact) {
		var result = this.name + ": ";
		result += this.reason || "(unknown reason)";
		if (!compact && this.mark) result += " " + this.mark.toString();
		return result;
	};
	module.exports = YAMLException$4;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/mark.js
var require_mark = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/mark.js"(exports, module) {
	var common$5 = require_common();
	function Mark$1(name, buffer, position, line, column) {
		this.name = name;
		this.buffer = buffer;
		this.position = position;
		this.line = line;
		this.column = column;
	}
	Mark$1.prototype.getSnippet = function getSnippet(indent, maxLength) {
		var head, start, tail, end, snippet$1;
		if (!this.buffer) return null;
		indent = indent || 4;
		maxLength = maxLength || 75;
		head = "";
		start = this.position;
		while (start > 0 && "\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
			start -= 1;
			if (this.position - start > maxLength / 2 - 1) {
				head = " ... ";
				start += 5;
				break;
			}
		}
		tail = "";
		end = this.position;
		while (end < this.buffer.length && "\0\r\n\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
			end += 1;
			if (end - this.position > maxLength / 2 - 1) {
				tail = " ... ";
				end -= 5;
				break;
			}
		}
		snippet$1 = this.buffer.slice(start, end);
		return common$5.repeat(" ", indent) + head + snippet$1 + tail + "\n" + common$5.repeat(" ", indent + this.position - start + head.length) + "^";
	};
	Mark$1.prototype.toString = function toString$1(compact) {
		var snippet$1, where = "";
		if (this.name) where += "in \"" + this.name + "\" ";
		where += "at line " + (this.line + 1) + ", column " + (this.column + 1);
		if (!compact) {
			snippet$1 = this.getSnippet();
			if (snippet$1) where += ":\n" + snippet$1;
		}
		return where;
	};
	module.exports = Mark$1;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type.js
var require_type = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type.js"(exports, module) {
	var YAMLException$3 = require_exception();
	var TYPE_CONSTRUCTOR_OPTIONS = [
		"kind",
		"resolve",
		"construct",
		"instanceOf",
		"predicate",
		"represent",
		"defaultStyle",
		"styleAliases"
	];
	var YAML_NODE_KINDS = [
		"scalar",
		"sequence",
		"mapping"
	];
	function compileStyleAliases(map$1) {
		var result = {};
		if (map$1 !== null) Object.keys(map$1).forEach(function(style) {
			map$1[style].forEach(function(alias) {
				result[String(alias)] = style;
			});
		});
		return result;
	}
	function Type$17(tag, options) {
		options = options || {};
		Object.keys(options).forEach(function(name) {
			if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) throw new YAMLException$3("Unknown option \"" + name + "\" is met in definition of \"" + tag + "\" YAML type.");
		});
		this.tag = tag;
		this.kind = options["kind"] || null;
		this.resolve = options["resolve"] || function() {
			return true;
		};
		this.construct = options["construct"] || function(data) {
			return data;
		};
		this.instanceOf = options["instanceOf"] || null;
		this.predicate = options["predicate"] || null;
		this.represent = options["represent"] || null;
		this.defaultStyle = options["defaultStyle"] || null;
		this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
		if (YAML_NODE_KINDS.indexOf(this.kind) === -1) throw new YAMLException$3("Unknown kind \"" + this.kind + "\" is specified for \"" + tag + "\" YAML type.");
	}
	module.exports = Type$17;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema.js
var require_schema = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema.js"(exports, module) {
	var common$4 = require_common();
	var YAMLException$2 = require_exception();
	var Type$16 = require_type();
	function compileList(schema$1, name, result) {
		var exclude = [];
		schema$1.include.forEach(function(includedSchema) {
			result = compileList(includedSchema, name, result);
		});
		schema$1[name].forEach(function(currentType) {
			result.forEach(function(previousType, previousIndex) {
				if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) exclude.push(previousIndex);
			});
			result.push(currentType);
		});
		return result.filter(function(type$1, index) {
			return exclude.indexOf(index) === -1;
		});
	}
	function compileMap() {
		var result = {
			scalar: {},
			sequence: {},
			mapping: {},
			fallback: {}
		}, index, length;
		function collectType(type$1) {
			result[type$1.kind][type$1.tag] = result["fallback"][type$1.tag] = type$1;
		}
		for (index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
		return result;
	}
	function Schema$5(definition) {
		this.include = definition.include || [];
		this.implicit = definition.implicit || [];
		this.explicit = definition.explicit || [];
		this.implicit.forEach(function(type$1) {
			if (type$1.loadKind && type$1.loadKind !== "scalar") throw new YAMLException$2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
		});
		this.compiledImplicit = compileList(this, "implicit", []);
		this.compiledExplicit = compileList(this, "explicit", []);
		this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
	}
	Schema$5.DEFAULT = null;
	Schema$5.create = function createSchema() {
		var schemas, types;
		switch (arguments.length) {
			case 1:
				schemas = Schema$5.DEFAULT;
				types = arguments[0];
				break;
			case 2:
				schemas = arguments[0];
				types = arguments[1];
				break;
			default: throw new YAMLException$2("Wrong number of arguments for Schema.create function");
		}
		schemas = common$4.toArray(schemas);
		types = common$4.toArray(types);
		if (!schemas.every(function(schema$1) {
			return schema$1 instanceof Schema$5;
		})) throw new YAMLException$2("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
		if (!types.every(function(type$1) {
			return type$1 instanceof Type$16;
		})) throw new YAMLException$2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		return new Schema$5({
			include: schemas,
			explicit: types
		});
	};
	module.exports = Schema$5;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/str.js
var require_str = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/str.js"(exports, module) {
	var Type$15 = require_type();
	module.exports = new Type$15("tag:yaml.org,2002:str", {
		kind: "scalar",
		construct: function(data) {
			return data !== null ? data : "";
		}
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/seq.js
var require_seq = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/seq.js"(exports, module) {
	var Type$14 = require_type();
	module.exports = new Type$14("tag:yaml.org,2002:seq", {
		kind: "sequence",
		construct: function(data) {
			return data !== null ? data : [];
		}
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/map.js
var require_map = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/map.js"(exports, module) {
	var Type$13 = require_type();
	module.exports = new Type$13("tag:yaml.org,2002:map", {
		kind: "mapping",
		construct: function(data) {
			return data !== null ? data : {};
		}
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/failsafe.js
var require_failsafe = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/failsafe.js"(exports, module) {
	var Schema$4 = require_schema();
	module.exports = new Schema$4({ explicit: [
		require_str(),
		require_seq(),
		require_map()
	] });
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/null.js
var require_null = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/null.js"(exports, module) {
	var Type$12 = require_type();
	function resolveYamlNull(data) {
		if (data === null) return true;
		var max = data.length;
		return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
	}
	function constructYamlNull() {
		return null;
	}
	function isNull(object) {
		return object === null;
	}
	module.exports = new Type$12("tag:yaml.org,2002:null", {
		kind: "scalar",
		resolve: resolveYamlNull,
		construct: constructYamlNull,
		predicate: isNull,
		represent: {
			canonical: function() {
				return "~";
			},
			lowercase: function() {
				return "null";
			},
			uppercase: function() {
				return "NULL";
			},
			camelcase: function() {
				return "Null";
			}
		},
		defaultStyle: "lowercase"
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/bool.js
var require_bool = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/bool.js"(exports, module) {
	var Type$11 = require_type();
	function resolveYamlBoolean(data) {
		if (data === null) return false;
		var max = data.length;
		return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
	}
	function constructYamlBoolean(data) {
		return data === "true" || data === "True" || data === "TRUE";
	}
	function isBoolean(object) {
		return Object.prototype.toString.call(object) === "[object Boolean]";
	}
	module.exports = new Type$11("tag:yaml.org,2002:bool", {
		kind: "scalar",
		resolve: resolveYamlBoolean,
		construct: constructYamlBoolean,
		predicate: isBoolean,
		represent: {
			lowercase: function(object) {
				return object ? "true" : "false";
			},
			uppercase: function(object) {
				return object ? "TRUE" : "FALSE";
			},
			camelcase: function(object) {
				return object ? "True" : "False";
			}
		},
		defaultStyle: "lowercase"
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/int.js
var require_int = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/int.js"(exports, module) {
	var common$3 = require_common();
	var Type$10 = require_type();
	function isHexCode(c) {
		return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
	}
	function isOctCode(c) {
		return 48 <= c && c <= 55;
	}
	function isDecCode(c) {
		return 48 <= c && c <= 57;
	}
	function resolveYamlInteger(data) {
		if (data === null) return false;
		var max = data.length, index = 0, hasDigits = false, ch;
		if (!max) return false;
		ch = data[index];
		if (ch === "-" || ch === "+") ch = data[++index];
		if (ch === "0") {
			if (index + 1 === max) return true;
			ch = data[++index];
			if (ch === "b") {
				index++;
				for (; index < max; index++) {
					ch = data[index];
					if (ch === "_") continue;
					if (ch !== "0" && ch !== "1") return false;
					hasDigits = true;
				}
				return hasDigits && ch !== "_";
			}
			if (ch === "x") {
				index++;
				for (; index < max; index++) {
					ch = data[index];
					if (ch === "_") continue;
					if (!isHexCode(data.charCodeAt(index))) return false;
					hasDigits = true;
				}
				return hasDigits && ch !== "_";
			}
			for (; index < max; index++) {
				ch = data[index];
				if (ch === "_") continue;
				if (!isOctCode(data.charCodeAt(index))) return false;
				hasDigits = true;
			}
			return hasDigits && ch !== "_";
		}
		if (ch === "_") return false;
		for (; index < max; index++) {
			ch = data[index];
			if (ch === "_") continue;
			if (ch === ":") break;
			if (!isDecCode(data.charCodeAt(index))) return false;
			hasDigits = true;
		}
		if (!hasDigits || ch === "_") return false;
		if (ch !== ":") return true;
		return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
	}
	function constructYamlInteger(data) {
		var value = data, sign = 1, ch, base, digits = [];
		if (value.indexOf("_") !== -1) value = value.replace(/_/g, "");
		ch = value[0];
		if (ch === "-" || ch === "+") {
			if (ch === "-") sign = -1;
			value = value.slice(1);
			ch = value[0];
		}
		if (value === "0") return 0;
		if (ch === "0") {
			if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
			if (value[1] === "x") return sign * parseInt(value, 16);
			return sign * parseInt(value, 8);
		}
		if (value.indexOf(":") !== -1) {
			value.split(":").forEach(function(v) {
				digits.unshift(parseInt(v, 10));
			});
			value = 0;
			base = 1;
			digits.forEach(function(d) {
				value += d * base;
				base *= 60;
			});
			return sign * value;
		}
		return sign * parseInt(value, 10);
	}
	function isInteger(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common$3.isNegativeZero(object);
	}
	module.exports = new Type$10("tag:yaml.org,2002:int", {
		kind: "scalar",
		resolve: resolveYamlInteger,
		construct: constructYamlInteger,
		predicate: isInteger,
		represent: {
			binary: function(obj) {
				return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
			},
			octal: function(obj) {
				return obj >= 0 ? "0" + obj.toString(8) : "-0" + obj.toString(8).slice(1);
			},
			decimal: function(obj) {
				return obj.toString(10);
			},
			hexadecimal: function(obj) {
				return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
			}
		},
		defaultStyle: "decimal",
		styleAliases: {
			binary: [2, "bin"],
			octal: [8, "oct"],
			decimal: [10, "dec"],
			hexadecimal: [16, "hex"]
		}
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/float.js
var require_float = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/float.js"(exports, module) {
	var common$2 = require_common();
	var Type$9 = require_type();
	var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	function resolveYamlFloat(data) {
		if (data === null) return false;
		if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") return false;
		return true;
	}
	function constructYamlFloat(data) {
		var value, sign, base, digits;
		value = data.replace(/_/g, "").toLowerCase();
		sign = value[0] === "-" ? -1 : 1;
		digits = [];
		if ("+-".indexOf(value[0]) >= 0) value = value.slice(1);
		if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
		else if (value === ".nan") return NaN;
		else if (value.indexOf(":") >= 0) {
			value.split(":").forEach(function(v) {
				digits.unshift(parseFloat(v, 10));
			});
			value = 0;
			base = 1;
			digits.forEach(function(d) {
				value += d * base;
				base *= 60;
			});
			return sign * value;
		}
		return sign * parseFloat(value, 10);
	}
	var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
	function representYamlFloat(object, style) {
		var res;
		if (isNaN(object)) switch (style) {
			case "lowercase": return ".nan";
			case "uppercase": return ".NAN";
			case "camelcase": return ".NaN";
		}
		else if (Number.POSITIVE_INFINITY === object) switch (style) {
			case "lowercase": return ".inf";
			case "uppercase": return ".INF";
			case "camelcase": return ".Inf";
		}
		else if (Number.NEGATIVE_INFINITY === object) switch (style) {
			case "lowercase": return "-.inf";
			case "uppercase": return "-.INF";
			case "camelcase": return "-.Inf";
		}
		else if (common$2.isNegativeZero(object)) return "-0.0";
		res = object.toString(10);
		return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
	}
	function isFloat(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common$2.isNegativeZero(object));
	}
	module.exports = new Type$9("tag:yaml.org,2002:float", {
		kind: "scalar",
		resolve: resolveYamlFloat,
		construct: constructYamlFloat,
		predicate: isFloat,
		represent: representYamlFloat,
		defaultStyle: "lowercase"
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/json.js
var require_json = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/json.js"(exports, module) {
	var Schema$3 = require_schema();
	module.exports = new Schema$3({
		include: [require_failsafe()],
		implicit: [
			require_null(),
			require_bool(),
			require_int(),
			require_float()
		]
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/core.js
var require_core = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/core.js"(exports, module) {
	var Schema$2 = require_schema();
	module.exports = new Schema$2({ include: [require_json()] });
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/timestamp.js
var require_timestamp = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/timestamp.js"(exports, module) {
	var Type$8 = require_type();
	var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
	var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
	function resolveYamlTimestamp(data) {
		if (data === null) return false;
		if (YAML_DATE_REGEXP.exec(data) !== null) return true;
		if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
		return false;
	}
	function constructYamlTimestamp(data) {
		var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
		match = YAML_DATE_REGEXP.exec(data);
		if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
		if (match === null) throw new Error("Date resolve error");
		year = +match[1];
		month = +match[2] - 1;
		day = +match[3];
		if (!match[4]) return new Date(Date.UTC(year, month, day));
		hour = +match[4];
		minute = +match[5];
		second = +match[6];
		if (match[7]) {
			fraction = match[7].slice(0, 3);
			while (fraction.length < 3) fraction += "0";
			fraction = +fraction;
		}
		if (match[9]) {
			tz_hour = +match[10];
			tz_minute = +(match[11] || 0);
			delta = (tz_hour * 60 + tz_minute) * 6e4;
			if (match[9] === "-") delta = -delta;
		}
		date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
		if (delta) date.setTime(date.getTime() - delta);
		return date;
	}
	function representYamlTimestamp(object) {
		return object.toISOString();
	}
	module.exports = new Type$8("tag:yaml.org,2002:timestamp", {
		kind: "scalar",
		resolve: resolveYamlTimestamp,
		construct: constructYamlTimestamp,
		instanceOf: Date,
		represent: representYamlTimestamp
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/merge.js
var require_merge = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/merge.js"(exports, module) {
	var Type$7 = require_type();
	function resolveYamlMerge(data) {
		return data === "<<" || data === null;
	}
	module.exports = new Type$7("tag:yaml.org,2002:merge", {
		kind: "scalar",
		resolve: resolveYamlMerge
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/binary.js
var require_binary = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/binary.js"(exports, module) {
	var NodeBuffer;
	try {
		var _require$1 = require;
		NodeBuffer = _require$1("buffer").Buffer;
	} catch (__) {}
	var Type$6 = require_type();
	var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
	function resolveYamlBinary(data) {
		if (data === null) return false;
		var code, idx, bitlen = 0, max = data.length, map$1 = BASE64_MAP;
		for (idx = 0; idx < max; idx++) {
			code = map$1.indexOf(data.charAt(idx));
			if (code > 64) continue;
			if (code < 0) return false;
			bitlen += 6;
		}
		return bitlen % 8 === 0;
	}
	function constructYamlBinary(data) {
		var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map$1 = BASE64_MAP, bits = 0, result = [];
		for (idx = 0; idx < max; idx++) {
			if (idx % 4 === 0 && idx) {
				result.push(bits >> 16 & 255);
				result.push(bits >> 8 & 255);
				result.push(bits & 255);
			}
			bits = bits << 6 | map$1.indexOf(input.charAt(idx));
		}
		tailbits = max % 4 * 6;
		if (tailbits === 0) {
			result.push(bits >> 16 & 255);
			result.push(bits >> 8 & 255);
			result.push(bits & 255);
		} else if (tailbits === 18) {
			result.push(bits >> 10 & 255);
			result.push(bits >> 2 & 255);
		} else if (tailbits === 12) result.push(bits >> 4 & 255);
		if (NodeBuffer) return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
		return result;
	}
	function representYamlBinary(object) {
		var result = "", bits = 0, idx, tail, max = object.length, map$1 = BASE64_MAP;
		for (idx = 0; idx < max; idx++) {
			if (idx % 3 === 0 && idx) {
				result += map$1[bits >> 18 & 63];
				result += map$1[bits >> 12 & 63];
				result += map$1[bits >> 6 & 63];
				result += map$1[bits & 63];
			}
			bits = (bits << 8) + object[idx];
		}
		tail = max % 3;
		if (tail === 0) {
			result += map$1[bits >> 18 & 63];
			result += map$1[bits >> 12 & 63];
			result += map$1[bits >> 6 & 63];
			result += map$1[bits & 63];
		} else if (tail === 2) {
			result += map$1[bits >> 10 & 63];
			result += map$1[bits >> 4 & 63];
			result += map$1[bits << 2 & 63];
			result += map$1[64];
		} else if (tail === 1) {
			result += map$1[bits >> 2 & 63];
			result += map$1[bits << 4 & 63];
			result += map$1[64];
			result += map$1[64];
		}
		return result;
	}
	function isBinary(object) {
		return NodeBuffer && NodeBuffer.isBuffer(object);
	}
	module.exports = new Type$6("tag:yaml.org,2002:binary", {
		kind: "scalar",
		resolve: resolveYamlBinary,
		construct: constructYamlBinary,
		predicate: isBinary,
		represent: representYamlBinary
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/omap.js
var require_omap = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/omap.js"(exports, module) {
	var Type$5 = require_type();
	var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
	var _toString$2 = Object.prototype.toString;
	function resolveYamlOmap(data) {
		if (data === null) return true;
		var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
		for (index = 0, length = object.length; index < length; index += 1) {
			pair = object[index];
			pairHasKey = false;
			if (_toString$2.call(pair) !== "[object Object]") return false;
			for (pairKey in pair) if (_hasOwnProperty$3.call(pair, pairKey)) if (!pairHasKey) pairHasKey = true;
			else return false;
			if (!pairHasKey) return false;
			if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
			else return false;
		}
		return true;
	}
	function constructYamlOmap(data) {
		return data !== null ? data : [];
	}
	module.exports = new Type$5("tag:yaml.org,2002:omap", {
		kind: "sequence",
		resolve: resolveYamlOmap,
		construct: constructYamlOmap
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/pairs.js
var require_pairs = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/pairs.js"(exports, module) {
	var Type$4 = require_type();
	var _toString$1 = Object.prototype.toString;
	function resolveYamlPairs(data) {
		if (data === null) return true;
		var index, length, pair, keys, result, object = data;
		result = new Array(object.length);
		for (index = 0, length = object.length; index < length; index += 1) {
			pair = object[index];
			if (_toString$1.call(pair) !== "[object Object]") return false;
			keys = Object.keys(pair);
			if (keys.length !== 1) return false;
			result[index] = [keys[0], pair[keys[0]]];
		}
		return true;
	}
	function constructYamlPairs(data) {
		if (data === null) return [];
		var index, length, pair, keys, result, object = data;
		result = new Array(object.length);
		for (index = 0, length = object.length; index < length; index += 1) {
			pair = object[index];
			keys = Object.keys(pair);
			result[index] = [keys[0], pair[keys[0]]];
		}
		return result;
	}
	module.exports = new Type$4("tag:yaml.org,2002:pairs", {
		kind: "sequence",
		resolve: resolveYamlPairs,
		construct: constructYamlPairs
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/set.js
var require_set = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/set.js"(exports, module) {
	var Type$3 = require_type();
	var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
	function resolveYamlSet(data) {
		if (data === null) return true;
		var key, object = data;
		for (key in object) if (_hasOwnProperty$2.call(object, key)) {
			if (object[key] !== null) return false;
		}
		return true;
	}
	function constructYamlSet(data) {
		return data !== null ? data : {};
	}
	module.exports = new Type$3("tag:yaml.org,2002:set", {
		kind: "mapping",
		resolve: resolveYamlSet,
		construct: constructYamlSet
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/default_safe.js
var require_default_safe = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/default_safe.js"(exports, module) {
	var Schema$1 = require_schema();
	module.exports = new Schema$1({
		include: [require_core()],
		implicit: [require_timestamp(), require_merge()],
		explicit: [
			require_binary(),
			require_omap(),
			require_pairs(),
			require_set()
		]
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/undefined.js
var require_undefined = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/undefined.js"(exports, module) {
	var Type$2 = require_type();
	function resolveJavascriptUndefined() {
		return true;
	}
	function constructJavascriptUndefined() {
		return void 0;
	}
	function representJavascriptUndefined() {
		return "";
	}
	function isUndefined(object) {
		return typeof object === "undefined";
	}
	module.exports = new Type$2("tag:yaml.org,2002:js/undefined", {
		kind: "scalar",
		resolve: resolveJavascriptUndefined,
		construct: constructJavascriptUndefined,
		predicate: isUndefined,
		represent: representJavascriptUndefined
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/regexp.js
var require_regexp = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/regexp.js"(exports, module) {
	var Type$1 = require_type();
	function resolveJavascriptRegExp(data) {
		if (data === null) return false;
		if (data.length === 0) return false;
		var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
		if (regexp[0] === "/") {
			if (tail) modifiers = tail[1];
			if (modifiers.length > 3) return false;
			if (regexp[regexp.length - modifiers.length - 1] !== "/") return false;
		}
		return true;
	}
	function constructJavascriptRegExp(data) {
		var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
		if (regexp[0] === "/") {
			if (tail) modifiers = tail[1];
			regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
		}
		return new RegExp(regexp, modifiers);
	}
	function representJavascriptRegExp(object) {
		var result = "/" + object.source + "/";
		if (object.global) result += "g";
		if (object.multiline) result += "m";
		if (object.ignoreCase) result += "i";
		return result;
	}
	function isRegExp(object) {
		return Object.prototype.toString.call(object) === "[object RegExp]";
	}
	module.exports = new Type$1("tag:yaml.org,2002:js/regexp", {
		kind: "scalar",
		resolve: resolveJavascriptRegExp,
		construct: constructJavascriptRegExp,
		predicate: isRegExp,
		represent: representJavascriptRegExp
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/function.js
var require_function = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/type/js/function.js"(exports, module) {
	var esprima;
	try {
		var _require = require;
		esprima = _require("esprima");
	} catch (_) {
		if (typeof window !== "undefined") esprima = window.esprima;
	}
	var Type = require_type();
	function resolveJavascriptFunction(data) {
		if (data === null) return false;
		try {
			var source = "(" + data + ")", ast = esprima.parse(source, { range: true });
			if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") return false;
			return true;
		} catch (err$1) {
			return false;
		}
	}
	function constructJavascriptFunction(data) {
		var source = "(" + data + ")", ast = esprima.parse(source, { range: true }), params = [], body;
		if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") throw new Error("Failed to resolve function");
		ast.body[0].expression.params.forEach(function(param) {
			params.push(param.name);
		});
		body = ast.body[0].expression.body.range;
		if (ast.body[0].expression.body.type === "BlockStatement") return new Function(params, source.slice(body[0] + 1, body[1] - 1));
		return new Function(params, "return " + source.slice(body[0], body[1]));
	}
	function representJavascriptFunction(object) {
		return object.toString();
	}
	function isFunction(object) {
		return Object.prototype.toString.call(object) === "[object Function]";
	}
	module.exports = new Type("tag:yaml.org,2002:js/function", {
		kind: "scalar",
		resolve: resolveJavascriptFunction,
		construct: constructJavascriptFunction,
		predicate: isFunction,
		represent: representJavascriptFunction
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/default_full.js
var require_default_full = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/schema/default_full.js"(exports, module) {
	var Schema = require_schema();
	module.exports = Schema.DEFAULT = new Schema({
		include: [require_default_safe()],
		explicit: [
			require_undefined(),
			require_regexp(),
			require_function()
		]
	});
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/loader.js
var require_loader = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/loader.js"(exports, module) {
	var common$1 = require_common();
	var YAMLException$1 = require_exception();
	var Mark = require_mark();
	var DEFAULT_SAFE_SCHEMA$1 = require_default_safe();
	var DEFAULT_FULL_SCHEMA$1 = require_default_full();
	var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
	var CONTEXT_FLOW_IN = 1;
	var CONTEXT_FLOW_OUT = 2;
	var CONTEXT_BLOCK_IN = 3;
	var CONTEXT_BLOCK_OUT = 4;
	var CHOMPING_CLIP = 1;
	var CHOMPING_STRIP = 2;
	var CHOMPING_KEEP = 3;
	var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
	var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
	var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
	var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
	function _class(obj) {
		return Object.prototype.toString.call(obj);
	}
	function is_EOL(c) {
		return c === 10 || c === 13;
	}
	function is_WHITE_SPACE(c) {
		return c === 9 || c === 32;
	}
	function is_WS_OR_EOL(c) {
		return c === 9 || c === 32 || c === 10 || c === 13;
	}
	function is_FLOW_INDICATOR(c) {
		return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
	}
	function fromHexCode(c) {
		var lc;
		if (48 <= c && c <= 57) return c - 48;
		lc = c | 32;
		if (97 <= lc && lc <= 102) return lc - 97 + 10;
		return -1;
	}
	function escapedHexLen(c) {
		if (c === 120) return 2;
		if (c === 117) return 4;
		if (c === 85) return 8;
		return 0;
	}
	function fromDecimalCode(c) {
		if (48 <= c && c <= 57) return c - 48;
		return -1;
	}
	function simpleEscapeSequence(c) {
		return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? "\"" : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
	}
	function charFromCodepoint(c) {
		if (c <= 65535) return String.fromCharCode(c);
		return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
	}
	function setProperty(object, key, value) {
		if (key === "__proto__") Object.defineProperty(object, key, {
			configurable: true,
			enumerable: true,
			writable: true,
			value
		});
		else object[key] = value;
	}
	var simpleEscapeCheck = new Array(256);
	var simpleEscapeMap = new Array(256);
	for (var i = 0; i < 256; i++) {
		simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
		simpleEscapeMap[i] = simpleEscapeSequence(i);
	}
	function State$1(input, options) {
		this.input = input;
		this.filename = options["filename"] || null;
		this.schema = options["schema"] || DEFAULT_FULL_SCHEMA$1;
		this.onWarning = options["onWarning"] || null;
		this.legacy = options["legacy"] || false;
		this.json = options["json"] || false;
		this.listener = options["listener"] || null;
		this.implicitTypes = this.schema.compiledImplicit;
		this.typeMap = this.schema.compiledTypeMap;
		this.length = input.length;
		this.position = 0;
		this.line = 0;
		this.lineStart = 0;
		this.lineIndent = 0;
		this.documents = [];
	}
	function generateError(state, message) {
		return new YAMLException$1(message, new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
	}
	function throwError(state, message) {
		throw generateError(state, message);
	}
	function throwWarning(state, message) {
		if (state.onWarning) state.onWarning.call(null, generateError(state, message));
	}
	var directiveHandlers = {
		YAML: function handleYamlDirective(state, name, args) {
			var match, major, minor;
			if (state.version !== null) throwError(state, "duplication of %YAML directive");
			if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
			match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
			if (match === null) throwError(state, "ill-formed argument of the YAML directive");
			major = parseInt(match[1], 10);
			minor = parseInt(match[2], 10);
			if (major !== 1) throwError(state, "unacceptable YAML version of the document");
			state.version = args[0];
			state.checkLineBreaks = minor < 2;
			if (minor !== 1 && minor !== 2) throwWarning(state, "unsupported YAML version of the document");
		},
		TAG: function handleTagDirective(state, name, args) {
			var handle, prefix;
			if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
			handle = args[0];
			prefix = args[1];
			if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
			if (_hasOwnProperty$1.call(state.tagMap, handle)) throwError(state, "there is a previously declared suffix for \"" + handle + "\" tag handle");
			if (!PATTERN_TAG_URI.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
			state.tagMap[handle] = prefix;
		}
	};
	function captureSegment(state, start, end, checkJson) {
		var _position, _length, _character, _result;
		if (start < end) {
			_result = state.input.slice(start, end);
			if (checkJson) for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
				_character = _result.charCodeAt(_position);
				if (!(_character === 9 || 32 <= _character && _character <= 1114111)) throwError(state, "expected valid JSON character");
			}
			else if (PATTERN_NON_PRINTABLE.test(_result)) throwError(state, "the stream contains non-printable characters");
			state.result += _result;
		}
	}
	function mergeMappings(state, destination, source, overridableKeys) {
		var sourceKeys, key, index, quantity;
		if (!common$1.isObject(source)) throwError(state, "cannot merge mappings; the provided source object is unacceptable");
		sourceKeys = Object.keys(source);
		for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
			key = sourceKeys[index];
			if (!_hasOwnProperty$1.call(destination, key)) {
				setProperty(destination, key, source[key]);
				overridableKeys[key] = true;
			}
		}
	}
	function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
		var index, quantity;
		if (Array.isArray(keyNode)) {
			keyNode = Array.prototype.slice.call(keyNode);
			for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
				if (Array.isArray(keyNode[index])) throwError(state, "nested arrays are not supported inside keys");
				if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") keyNode[index] = "[object Object]";
			}
		}
		if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") keyNode = "[object Object]";
		keyNode = String(keyNode);
		if (_result === null) _result = {};
		if (keyTag === "tag:yaml.org,2002:merge") if (Array.isArray(valueNode)) for (index = 0, quantity = valueNode.length; index < quantity; index += 1) mergeMappings(state, _result, valueNode[index], overridableKeys);
		else mergeMappings(state, _result, valueNode, overridableKeys);
		else {
			if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
				state.line = startLine || state.line;
				state.position = startPos || state.position;
				throwError(state, "duplicated mapping key");
			}
			setProperty(_result, keyNode, valueNode);
			delete overridableKeys[keyNode];
		}
		return _result;
	}
	function readLineBreak(state) {
		var ch;
		ch = state.input.charCodeAt(state.position);
		if (ch === 10) state.position++;
		else if (ch === 13) {
			state.position++;
			if (state.input.charCodeAt(state.position) === 10) state.position++;
		} else throwError(state, "a line break is expected");
		state.line += 1;
		state.lineStart = state.position;
	}
	function skipSeparationSpace(state, allowComments, checkIndent) {
		var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);
			if (allowComments && ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 10 && ch !== 13 && ch !== 0);
			if (is_EOL(ch)) {
				readLineBreak(state);
				ch = state.input.charCodeAt(state.position);
				lineBreaks++;
				state.lineIndent = 0;
				while (ch === 32) {
					state.lineIndent++;
					ch = state.input.charCodeAt(++state.position);
				}
			} else break;
		}
		if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) throwWarning(state, "deficient indentation");
		return lineBreaks;
	}
	function testDocumentSeparator(state) {
		var _position = state.position, ch;
		ch = state.input.charCodeAt(_position);
		if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
			_position += 3;
			ch = state.input.charCodeAt(_position);
			if (ch === 0 || is_WS_OR_EOL(ch)) return true;
		}
		return false;
	}
	function writeFoldedLines(state, count) {
		if (count === 1) state.result += " ";
		else if (count > 1) state.result += common$1.repeat("\n", count - 1);
	}
	function readPlainScalar(state, nodeIndent, withinFlowCollection) {
		var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
		ch = state.input.charCodeAt(state.position);
		if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) return false;
		if (ch === 63 || ch === 45) {
			following = state.input.charCodeAt(state.position + 1);
			if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) return false;
		}
		state.kind = "scalar";
		state.result = "";
		captureStart = captureEnd = state.position;
		hasPendingContent = false;
		while (ch !== 0) {
			if (ch === 58) {
				following = state.input.charCodeAt(state.position + 1);
				if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) break;
			} else if (ch === 35) {
				preceding = state.input.charCodeAt(state.position - 1);
				if (is_WS_OR_EOL(preceding)) break;
			} else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) break;
			else if (is_EOL(ch)) {
				_line = state.line;
				_lineStart = state.lineStart;
				_lineIndent = state.lineIndent;
				skipSeparationSpace(state, false, -1);
				if (state.lineIndent >= nodeIndent) {
					hasPendingContent = true;
					ch = state.input.charCodeAt(state.position);
					continue;
				} else {
					state.position = captureEnd;
					state.line = _line;
					state.lineStart = _lineStart;
					state.lineIndent = _lineIndent;
					break;
				}
			}
			if (hasPendingContent) {
				captureSegment(state, captureStart, captureEnd, false);
				writeFoldedLines(state, state.line - _line);
				captureStart = captureEnd = state.position;
				hasPendingContent = false;
			}
			if (!is_WHITE_SPACE(ch)) captureEnd = state.position + 1;
			ch = state.input.charCodeAt(++state.position);
		}
		captureSegment(state, captureStart, captureEnd, false);
		if (state.result) return true;
		state.kind = _kind;
		state.result = _result;
		return false;
	}
	function readSingleQuotedScalar(state, nodeIndent) {
		var ch, captureStart, captureEnd;
		ch = state.input.charCodeAt(state.position);
		if (ch !== 39) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 39) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (ch === 39) {
				captureStart = state.position;
				state.position++;
				captureEnd = state.position;
			} else return true;
		} else if (is_EOL(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
		else {
			state.position++;
			captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a single quoted scalar");
	}
	function readDoubleQuotedScalar(state, nodeIndent) {
		var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch !== 34) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 34) {
			captureSegment(state, captureStart, state.position, true);
			state.position++;
			return true;
		} else if (ch === 92) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (is_EOL(ch)) skipSeparationSpace(state, false, nodeIndent);
			else if (ch < 256 && simpleEscapeCheck[ch]) {
				state.result += simpleEscapeMap[ch];
				state.position++;
			} else if ((tmp = escapedHexLen(ch)) > 0) {
				hexLength = tmp;
				hexResult = 0;
				for (; hexLength > 0; hexLength--) {
					ch = state.input.charCodeAt(++state.position);
					if ((tmp = fromHexCode(ch)) >= 0) hexResult = (hexResult << 4) + tmp;
					else throwError(state, "expected hexadecimal character");
				}
				state.result += charFromCodepoint(hexResult);
				state.position++;
			} else throwError(state, "unknown escape sequence");
			captureStart = captureEnd = state.position;
		} else if (is_EOL(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
		else {
			state.position++;
			captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a double quoted scalar");
	}
	function readFlowCollection(state, nodeIndent) {
		var readNext = true, _line, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = {}, keyNode, keyTag, valueNode, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch === 91) {
			terminator = 93;
			isMapping = false;
			_result = [];
		} else if (ch === 123) {
			terminator = 125;
			isMapping = true;
			_result = {};
		} else return false;
		if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
		ch = state.input.charCodeAt(++state.position);
		while (ch !== 0) {
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === terminator) {
				state.position++;
				state.tag = _tag;
				state.anchor = _anchor;
				state.kind = isMapping ? "mapping" : "sequence";
				state.result = _result;
				return true;
			} else if (!readNext) throwError(state, "missed comma between flow collection entries");
			keyTag = keyNode = valueNode = null;
			isPair = isExplicitPair = false;
			if (ch === 63) {
				following = state.input.charCodeAt(state.position + 1);
				if (is_WS_OR_EOL(following)) {
					isPair = isExplicitPair = true;
					state.position++;
					skipSeparationSpace(state, true, nodeIndent);
				}
			}
			_line = state.line;
			composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
			keyTag = state.tag;
			keyNode = state.result;
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if ((isExplicitPair || state.line === _line) && ch === 58) {
				isPair = true;
				ch = state.input.charCodeAt(++state.position);
				skipSeparationSpace(state, true, nodeIndent);
				composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
				valueNode = state.result;
			}
			if (isMapping) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
			else if (isPair) _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
			else _result.push(keyNode);
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === 44) {
				readNext = true;
				ch = state.input.charCodeAt(++state.position);
			} else readNext = false;
		}
		throwError(state, "unexpected end of the stream within a flow collection");
	}
	function readBlockScalar(state, nodeIndent) {
		var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch === 124) folding = false;
		else if (ch === 62) folding = true;
		else return false;
		state.kind = "scalar";
		state.result = "";
		while (ch !== 0) {
			ch = state.input.charCodeAt(++state.position);
			if (ch === 43 || ch === 45) if (CHOMPING_CLIP === chomping) chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
			else throwError(state, "repeat of a chomping mode identifier");
			else if ((tmp = fromDecimalCode(ch)) >= 0) if (tmp === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
			else if (!detectedIndent) {
				textIndent = nodeIndent + tmp - 1;
				detectedIndent = true;
			} else throwError(state, "repeat of an indentation width identifier");
			else break;
		}
		if (is_WHITE_SPACE(ch)) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (is_WHITE_SPACE(ch));
			if (ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (!is_EOL(ch) && ch !== 0);
		}
		while (ch !== 0) {
			readLineBreak(state);
			state.lineIndent = 0;
			ch = state.input.charCodeAt(state.position);
			while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
				state.lineIndent++;
				ch = state.input.charCodeAt(++state.position);
			}
			if (!detectedIndent && state.lineIndent > textIndent) textIndent = state.lineIndent;
			if (is_EOL(ch)) {
				emptyLines++;
				continue;
			}
			if (state.lineIndent < textIndent) {
				if (chomping === CHOMPING_KEEP) state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
				else if (chomping === CHOMPING_CLIP) {
					if (didReadContent) state.result += "\n";
				}
				break;
			}
			if (folding) if (is_WHITE_SPACE(ch)) {
				atMoreIndented = true;
				state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			} else if (atMoreIndented) {
				atMoreIndented = false;
				state.result += common$1.repeat("\n", emptyLines + 1);
			} else if (emptyLines === 0) {
				if (didReadContent) state.result += " ";
			} else state.result += common$1.repeat("\n", emptyLines);
			else state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			didReadContent = true;
			detectedIndent = true;
			emptyLines = 0;
			captureStart = state.position;
			while (!is_EOL(ch) && ch !== 0) ch = state.input.charCodeAt(++state.position);
			captureSegment(state, captureStart, state.position, false);
		}
		return true;
	}
	function readBlockSequence(state, nodeIndent) {
		var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
		if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
		ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			if (ch !== 45) break;
			following = state.input.charCodeAt(state.position + 1);
			if (!is_WS_OR_EOL(following)) break;
			detected = true;
			state.position++;
			if (skipSeparationSpace(state, true, -1)) {
				if (state.lineIndent <= nodeIndent) {
					_result.push(null);
					ch = state.input.charCodeAt(state.position);
					continue;
				}
			}
			_line = state.line;
			composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
			_result.push(state.result);
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a sequence entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "sequence";
			state.result = _result;
			return true;
		}
		return false;
	}
	function readBlockMapping(state, nodeIndent, flowIndent) {
		var following, allowCompact, _line, _pos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = {}, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
		if (state.anchor !== null) state.anchorMap[state.anchor] = _result;
		ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			following = state.input.charCodeAt(state.position + 1);
			_line = state.line;
			_pos = state.position;
			if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
				if (ch === 63) {
					if (atExplicitKey) {
						storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = true;
					allowCompact = true;
				} else if (atExplicitKey) {
					atExplicitKey = false;
					allowCompact = true;
				} else throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
				state.position += 1;
				ch = following;
			} else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) if (state.line === _line) {
				ch = state.input.charCodeAt(state.position);
				while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 58) {
					ch = state.input.charCodeAt(++state.position);
					if (!is_WS_OR_EOL(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
					if (atExplicitKey) {
						storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = false;
					allowCompact = false;
					keyTag = state.tag;
					keyNode = state.result;
				} else if (detected) throwError(state, "can not read an implicit mapping pair; a colon is missed");
				else {
					state.tag = _tag;
					state.anchor = _anchor;
					return true;
				}
			} else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
			else {
				state.tag = _tag;
				state.anchor = _anchor;
				return true;
			}
			else break;
			if (state.line === _line || state.lineIndent > nodeIndent) {
				if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) if (atExplicitKey) keyNode = state.result;
				else valueNode = state.result;
				if (!atExplicitKey) {
					storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
					keyTag = keyNode = valueNode = null;
				}
				skipSeparationSpace(state, true, -1);
				ch = state.input.charCodeAt(state.position);
			}
			if (state.lineIndent > nodeIndent && ch !== 0) throwError(state, "bad indentation of a mapping entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (atExplicitKey) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "mapping";
			state.result = _result;
		}
		return detected;
	}
	function readTagProperty(state) {
		var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch !== 33) return false;
		if (state.tag !== null) throwError(state, "duplication of a tag property");
		ch = state.input.charCodeAt(++state.position);
		if (ch === 60) {
			isVerbatim = true;
			ch = state.input.charCodeAt(++state.position);
		} else if (ch === 33) {
			isNamed = true;
			tagHandle = "!!";
			ch = state.input.charCodeAt(++state.position);
		} else tagHandle = "!";
		_position = state.position;
		if (isVerbatim) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 0 && ch !== 62);
			if (state.position < state.length) {
				tagName = state.input.slice(_position, state.position);
				ch = state.input.charCodeAt(++state.position);
			} else throwError(state, "unexpected end of the stream within a verbatim tag");
		} else {
			while (ch !== 0 && !is_WS_OR_EOL(ch)) {
				if (ch === 33) if (!isNamed) {
					tagHandle = state.input.slice(_position - 1, state.position + 1);
					if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
					isNamed = true;
					_position = state.position + 1;
				} else throwError(state, "tag suffix cannot contain exclamation marks");
				ch = state.input.charCodeAt(++state.position);
			}
			tagName = state.input.slice(_position, state.position);
			if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
		}
		if (tagName && !PATTERN_TAG_URI.test(tagName)) throwError(state, "tag name cannot contain such characters: " + tagName);
		if (isVerbatim) state.tag = tagName;
		else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) state.tag = state.tagMap[tagHandle] + tagName;
		else if (tagHandle === "!") state.tag = "!" + tagName;
		else if (tagHandle === "!!") state.tag = "tag:yaml.org,2002:" + tagName;
		else throwError(state, "undeclared tag handle \"" + tagHandle + "\"");
		return true;
	}
	function readAnchorProperty(state) {
		var _position, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch !== 38) return false;
		if (state.anchor !== null) throwError(state, "duplication of an anchor property");
		ch = state.input.charCodeAt(++state.position);
		_position = state.position;
		while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an anchor node must contain at least one character");
		state.anchor = state.input.slice(_position, state.position);
		return true;
	}
	function readAlias(state) {
		var _position, alias, ch;
		ch = state.input.charCodeAt(state.position);
		if (ch !== 42) return false;
		ch = state.input.charCodeAt(++state.position);
		_position = state.position;
		while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an alias node must contain at least one character");
		alias = state.input.slice(_position, state.position);
		if (!_hasOwnProperty$1.call(state.anchorMap, alias)) throwError(state, "unidentified alias \"" + alias + "\"");
		state.result = state.anchorMap[alias];
		skipSeparationSpace(state, true, -1);
		return true;
	}
	function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
		var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, type$1, flowIndent, blockIndent;
		if (state.listener !== null) state.listener("open", state);
		state.tag = null;
		state.anchor = null;
		state.kind = null;
		state.result = null;
		allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
		if (allowToSeek) {
			if (skipSeparationSpace(state, true, -1)) {
				atNewLine = true;
				if (state.lineIndent > parentIndent) indentStatus = 1;
				else if (state.lineIndent === parentIndent) indentStatus = 0;
				else if (state.lineIndent < parentIndent) indentStatus = -1;
			}
		}
		if (indentStatus === 1) while (readTagProperty(state) || readAnchorProperty(state)) if (skipSeparationSpace(state, true, -1)) {
			atNewLine = true;
			allowBlockCollections = allowBlockStyles;
			if (state.lineIndent > parentIndent) indentStatus = 1;
			else if (state.lineIndent === parentIndent) indentStatus = 0;
			else if (state.lineIndent < parentIndent) indentStatus = -1;
		} else allowBlockCollections = false;
		if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
		if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
			if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) flowIndent = parentIndent;
			else flowIndent = parentIndent + 1;
			blockIndent = state.position - state.lineStart;
			if (indentStatus === 1) if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) hasContent = true;
			else {
				if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) hasContent = true;
				else if (readAlias(state)) {
					hasContent = true;
					if (state.tag !== null || state.anchor !== null) throwError(state, "alias node should not have any properties");
				} else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
					hasContent = true;
					if (state.tag === null) state.tag = "?";
				}
				if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
			}
			else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
		}
		if (state.tag !== null && state.tag !== "!") if (state.tag === "?") {
			if (state.result !== null && state.kind !== "scalar") throwError(state, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + state.kind + "\"");
			for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
				type$1 = state.implicitTypes[typeIndex];
				if (type$1.resolve(state.result)) {
					state.result = type$1.construct(state.result);
					state.tag = type$1.tag;
					if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
					break;
				}
			}
		} else if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
			type$1 = state.typeMap[state.kind || "fallback"][state.tag];
			if (state.result !== null && type$1.kind !== state.kind) throwError(state, "unacceptable node kind for !<" + state.tag + "> tag; it should be \"" + type$1.kind + "\", not \"" + state.kind + "\"");
			if (!type$1.resolve(state.result)) throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
			else {
				state.result = type$1.construct(state.result);
				if (state.anchor !== null) state.anchorMap[state.anchor] = state.result;
			}
		} else throwError(state, "unknown tag !<" + state.tag + ">");
		if (state.listener !== null) state.listener("close", state);
		return state.tag !== null || state.anchor !== null || hasContent;
	}
	function readDocument(state) {
		var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
		state.version = null;
		state.checkLineBreaks = state.legacy;
		state.tagMap = {};
		state.anchorMap = {};
		while ((ch = state.input.charCodeAt(state.position)) !== 0) {
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if (state.lineIndent > 0 || ch !== 37) break;
			hasDirectives = true;
			ch = state.input.charCodeAt(++state.position);
			_position = state.position;
			while (ch !== 0 && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);
			directiveName = state.input.slice(_position, state.position);
			directiveArgs = [];
			if (directiveName.length < 1) throwError(state, "directive name must not be less than one character in length");
			while (ch !== 0) {
				while (is_WHITE_SPACE(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 35) {
					do
						ch = state.input.charCodeAt(++state.position);
					while (ch !== 0 && !is_EOL(ch));
					break;
				}
				if (is_EOL(ch)) break;
				_position = state.position;
				while (ch !== 0 && !is_WS_OR_EOL(ch)) ch = state.input.charCodeAt(++state.position);
				directiveArgs.push(state.input.slice(_position, state.position));
			}
			if (ch !== 0) readLineBreak(state);
			if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) directiveHandlers[directiveName](state, directiveName, directiveArgs);
			else throwWarning(state, "unknown document directive \"" + directiveName + "\"");
		}
		skipSeparationSpace(state, true, -1);
		if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
			state.position += 3;
			skipSeparationSpace(state, true, -1);
		} else if (hasDirectives) throwError(state, "directives end mark is expected");
		composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
		skipSeparationSpace(state, true, -1);
		if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) throwWarning(state, "non-ASCII line breaks are interpreted as content");
		state.documents.push(state.result);
		if (state.position === state.lineStart && testDocumentSeparator(state)) {
			if (state.input.charCodeAt(state.position) === 46) {
				state.position += 3;
				skipSeparationSpace(state, true, -1);
			}
			return;
		}
		if (state.position < state.length - 1) throwError(state, "end of the stream or a document separator is expected");
		else return;
	}
	function loadDocuments(input, options) {
		input = String(input);
		options = options || {};
		if (input.length !== 0) {
			if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) input += "\n";
			if (input.charCodeAt(0) === 65279) input = input.slice(1);
		}
		var state = new State$1(input, options);
		var nullpos = input.indexOf("\0");
		if (nullpos !== -1) {
			state.position = nullpos;
			throwError(state, "null byte is not allowed in input");
		}
		state.input += "\0";
		while (state.input.charCodeAt(state.position) === 32) {
			state.lineIndent += 1;
			state.position += 1;
		}
		while (state.position < state.length - 1) readDocument(state);
		return state.documents;
	}
	function loadAll(input, iterator, options) {
		if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
			options = iterator;
			iterator = null;
		}
		var documents = loadDocuments(input, options);
		if (typeof iterator !== "function") return documents;
		for (var index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
	}
	function load(input, options) {
		var documents = loadDocuments(input, options);
		if (documents.length === 0) return void 0;
		else if (documents.length === 1) return documents[0];
		throw new YAMLException$1("expected a single document in the stream, but found more");
	}
	function safeLoadAll(input, iterator, options) {
		if (typeof iterator === "object" && iterator !== null && typeof options === "undefined") {
			options = iterator;
			iterator = null;
		}
		return loadAll(input, iterator, common$1.extend({ schema: DEFAULT_SAFE_SCHEMA$1 }, options));
	}
	function safeLoad(input, options) {
		return load(input, common$1.extend({ schema: DEFAULT_SAFE_SCHEMA$1 }, options));
	}
	module.exports.loadAll = loadAll;
	module.exports.load = load;
	module.exports.safeLoadAll = safeLoadAll;
	module.exports.safeLoad = safeLoad;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/dumper.js
var require_dumper = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml/dumper.js"(exports, module) {
	var common = require_common();
	var YAMLException = require_exception();
	var DEFAULT_FULL_SCHEMA = require_default_full();
	var DEFAULT_SAFE_SCHEMA = require_default_safe();
	var _toString = Object.prototype.toString;
	var _hasOwnProperty = Object.prototype.hasOwnProperty;
	var CHAR_TAB = 9;
	var CHAR_LINE_FEED = 10;
	var CHAR_CARRIAGE_RETURN = 13;
	var CHAR_SPACE = 32;
	var CHAR_EXCLAMATION = 33;
	var CHAR_DOUBLE_QUOTE = 34;
	var CHAR_SHARP = 35;
	var CHAR_PERCENT = 37;
	var CHAR_AMPERSAND = 38;
	var CHAR_SINGLE_QUOTE = 39;
	var CHAR_ASTERISK = 42;
	var CHAR_COMMA = 44;
	var CHAR_MINUS = 45;
	var CHAR_COLON = 58;
	var CHAR_EQUALS = 61;
	var CHAR_GREATER_THAN = 62;
	var CHAR_QUESTION = 63;
	var CHAR_COMMERCIAL_AT = 64;
	var CHAR_LEFT_SQUARE_BRACKET = 91;
	var CHAR_RIGHT_SQUARE_BRACKET = 93;
	var CHAR_GRAVE_ACCENT = 96;
	var CHAR_LEFT_CURLY_BRACKET = 123;
	var CHAR_VERTICAL_LINE = 124;
	var CHAR_RIGHT_CURLY_BRACKET = 125;
	var ESCAPE_SEQUENCES = {};
	ESCAPE_SEQUENCES[0] = "\\0";
	ESCAPE_SEQUENCES[7] = "\\a";
	ESCAPE_SEQUENCES[8] = "\\b";
	ESCAPE_SEQUENCES[9] = "\\t";
	ESCAPE_SEQUENCES[10] = "\\n";
	ESCAPE_SEQUENCES[11] = "\\v";
	ESCAPE_SEQUENCES[12] = "\\f";
	ESCAPE_SEQUENCES[13] = "\\r";
	ESCAPE_SEQUENCES[27] = "\\e";
	ESCAPE_SEQUENCES[34] = "\\\"";
	ESCAPE_SEQUENCES[92] = "\\\\";
	ESCAPE_SEQUENCES[133] = "\\N";
	ESCAPE_SEQUENCES[160] = "\\_";
	ESCAPE_SEQUENCES[8232] = "\\L";
	ESCAPE_SEQUENCES[8233] = "\\P";
	var DEPRECATED_BOOLEANS_SYNTAX = [
		"y",
		"Y",
		"yes",
		"Yes",
		"YES",
		"on",
		"On",
		"ON",
		"n",
		"N",
		"no",
		"No",
		"NO",
		"off",
		"Off",
		"OFF"
	];
	function compileStyleMap(schema$1, map$1) {
		var result, keys, index, length, tag, style, type$1;
		if (map$1 === null) return {};
		result = {};
		keys = Object.keys(map$1);
		for (index = 0, length = keys.length; index < length; index += 1) {
			tag = keys[index];
			style = String(map$1[tag]);
			if (tag.slice(0, 2) === "!!") tag = "tag:yaml.org,2002:" + tag.slice(2);
			type$1 = schema$1.compiledTypeMap["fallback"][tag];
			if (type$1 && _hasOwnProperty.call(type$1.styleAliases, style)) style = type$1.styleAliases[style];
			result[tag] = style;
		}
		return result;
	}
	function encodeHex(character) {
		var string, handle, length;
		string = character.toString(16).toUpperCase();
		if (character <= 255) {
			handle = "x";
			length = 2;
		} else if (character <= 65535) {
			handle = "u";
			length = 4;
		} else if (character <= 4294967295) {
			handle = "U";
			length = 8;
		} else throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
		return "\\" + handle + common.repeat("0", length - string.length) + string;
	}
	function State(options) {
		this.schema = options["schema"] || DEFAULT_FULL_SCHEMA;
		this.indent = Math.max(1, options["indent"] || 2);
		this.noArrayIndent = options["noArrayIndent"] || false;
		this.skipInvalid = options["skipInvalid"] || false;
		this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
		this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
		this.sortKeys = options["sortKeys"] || false;
		this.lineWidth = options["lineWidth"] || 80;
		this.noRefs = options["noRefs"] || false;
		this.noCompatMode = options["noCompatMode"] || false;
		this.condenseFlow = options["condenseFlow"] || false;
		this.implicitTypes = this.schema.compiledImplicit;
		this.explicitTypes = this.schema.compiledExplicit;
		this.tag = null;
		this.result = "";
		this.duplicates = [];
		this.usedDuplicates = null;
	}
	function indentString(string, spaces) {
		var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
		while (position < length) {
			next = string.indexOf("\n", position);
			if (next === -1) {
				line = string.slice(position);
				position = length;
			} else {
				line = string.slice(position, next + 1);
				position = next + 1;
			}
			if (line.length && line !== "\n") result += ind;
			result += line;
		}
		return result;
	}
	function generateNextLine(state, level) {
		return "\n" + common.repeat(" ", state.indent * level);
	}
	function testImplicitResolving(state, str$1) {
		var index, length, type$1;
		for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
			type$1 = state.implicitTypes[index];
			if (type$1.resolve(str$1)) return true;
		}
		return false;
	}
	function isWhitespace(c) {
		return c === CHAR_SPACE || c === CHAR_TAB;
	}
	function isPrintable(c) {
		return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
	}
	function isNsChar(c) {
		return isPrintable(c) && !isWhitespace(c) && c !== 65279 && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
	}
	function isPlainSafe(c, prev) {
		return isPrintable(c) && c !== 65279 && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
	}
	function isPlainSafeFirst(c) {
		return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
	}
	function needIndentIndicator(string) {
		var leadingSpaceRe = /^\n* /;
		return leadingSpaceRe.test(string);
	}
	var STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
	function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
		var i$2;
		var char, prev_char;
		var hasLineBreak = false;
		var hasFoldableLine = false;
		var shouldTrackWidth = lineWidth !== -1;
		var previousLineBreak = -1;
		var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
		if (singleLineOnly) for (i$2 = 0; i$2 < string.length; i$2++) {
			char = string.charCodeAt(i$2);
			if (!isPrintable(char)) return STYLE_DOUBLE;
			prev_char = i$2 > 0 ? string.charCodeAt(i$2 - 1) : null;
			plain = plain && isPlainSafe(char, prev_char);
		}
		else {
			for (i$2 = 0; i$2 < string.length; i$2++) {
				char = string.charCodeAt(i$2);
				if (char === CHAR_LINE_FEED) {
					hasLineBreak = true;
					if (shouldTrackWidth) {
						hasFoldableLine = hasFoldableLine || i$2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
						previousLineBreak = i$2;
					}
				} else if (!isPrintable(char)) return STYLE_DOUBLE;
				prev_char = i$2 > 0 ? string.charCodeAt(i$2 - 1) : null;
				plain = plain && isPlainSafe(char, prev_char);
			}
			hasFoldableLine = hasFoldableLine || shouldTrackWidth && i$2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
		}
		if (!hasLineBreak && !hasFoldableLine) return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
		if (indentPerLevel > 9 && needIndentIndicator(string)) return STYLE_DOUBLE;
		return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
	}
	function writeScalar(state, string, level, iskey) {
		state.dump = function() {
			if (string.length === 0) return "''";
			if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) return "'" + string + "'";
			var indent = state.indent * Math.max(1, level);
			var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
			var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
			function testAmbiguity(string$1) {
				return testImplicitResolving(state, string$1);
			}
			switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
				case STYLE_PLAIN: return string;
				case STYLE_SINGLE: return "'" + string.replace(/'/g, "''") + "'";
				case STYLE_LITERAL: return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
				case STYLE_FOLDED: return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
				case STYLE_DOUBLE: return "\"" + escapeString(string, lineWidth) + "\"";
				default: throw new YAMLException("impossible error: invalid scalar style");
			}
		}();
	}
	function blockHeader(string, indentPerLevel) {
		var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
		var clip = string[string.length - 1] === "\n";
		var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
		var chomp = keep ? "+" : clip ? "" : "-";
		return indentIndicator + chomp + "\n";
	}
	function dropEndingNewline(string) {
		return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
	}
	function foldString(string, width) {
		var lineRe = /(\n+)([^\n]*)/g;
		var result = function() {
			var nextLF = string.indexOf("\n");
			nextLF = nextLF !== -1 ? nextLF : string.length;
			lineRe.lastIndex = nextLF;
			return foldLine(string.slice(0, nextLF), width);
		}();
		var prevMoreIndented = string[0] === "\n" || string[0] === " ";
		var moreIndented;
		var match;
		while (match = lineRe.exec(string)) {
			var prefix = match[1], line = match[2];
			moreIndented = line[0] === " ";
			result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
			prevMoreIndented = moreIndented;
		}
		return result;
	}
	function foldLine(line, width) {
		if (line === "" || line[0] === " ") return line;
		var breakRe = / [^ ]/g;
		var match;
		var start = 0, end, curr = 0, next = 0;
		var result = "";
		while (match = breakRe.exec(line)) {
			next = match.index;
			if (next - start > width) {
				end = curr > start ? curr : next;
				result += "\n" + line.slice(start, end);
				start = end + 1;
			}
			curr = next;
		}
		result += "\n";
		if (line.length - start > width && curr > start) result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
		else result += line.slice(start);
		return result.slice(1);
	}
	function escapeString(string) {
		var result = "";
		var char, nextChar;
		var escapeSeq;
		for (var i$2 = 0; i$2 < string.length; i$2++) {
			char = string.charCodeAt(i$2);
			if (char >= 55296 && char <= 56319) {
				nextChar = string.charCodeAt(i$2 + 1);
				if (nextChar >= 56320 && nextChar <= 57343) {
					result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
					i$2++;
					continue;
				}
			}
			escapeSeq = ESCAPE_SEQUENCES[char];
			result += !escapeSeq && isPrintable(char) ? string[i$2] : escapeSeq || encodeHex(char);
		}
		return result;
	}
	function writeFlowSequence(state, level, object) {
		var _result = "", _tag = state.tag, index, length;
		for (index = 0, length = object.length; index < length; index += 1) if (writeNode(state, level, object[index], false, false)) {
			if (index !== 0) _result += "," + (!state.condenseFlow ? " " : "");
			_result += state.dump;
		}
		state.tag = _tag;
		state.dump = "[" + _result + "]";
	}
	function writeBlockSequence(state, level, object, compact) {
		var _result = "", _tag = state.tag, index, length;
		for (index = 0, length = object.length; index < length; index += 1) if (writeNode(state, level + 1, object[index], true, true)) {
			if (!compact || index !== 0) _result += generateNextLine(state, level);
			if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) _result += "-";
			else _result += "- ";
			_result += state.dump;
		}
		state.tag = _tag;
		state.dump = _result || "[]";
	}
	function writeFlowMapping(state, level, object) {
		var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
		for (index = 0, length = objectKeyList.length; index < length; index += 1) {
			pairBuffer = "";
			if (index !== 0) pairBuffer += ", ";
			if (state.condenseFlow) pairBuffer += "\"";
			objectKey = objectKeyList[index];
			objectValue = object[objectKey];
			if (!writeNode(state, level, objectKey, false, false)) continue;
			if (state.dump.length > 1024) pairBuffer += "? ";
			pairBuffer += state.dump + (state.condenseFlow ? "\"" : "") + ":" + (state.condenseFlow ? "" : " ");
			if (!writeNode(state, level, objectValue, false, false)) continue;
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = "{" + _result + "}";
	}
	function writeBlockMapping(state, level, object, compact) {
		var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
		if (state.sortKeys === true) objectKeyList.sort();
		else if (typeof state.sortKeys === "function") objectKeyList.sort(state.sortKeys);
		else if (state.sortKeys) throw new YAMLException("sortKeys must be a boolean or a function");
		for (index = 0, length = objectKeyList.length; index < length; index += 1) {
			pairBuffer = "";
			if (!compact || index !== 0) pairBuffer += generateNextLine(state, level);
			objectKey = objectKeyList[index];
			objectValue = object[objectKey];
			if (!writeNode(state, level + 1, objectKey, true, true, true)) continue;
			explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
			if (explicitPair) if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += "?";
			else pairBuffer += "? ";
			pairBuffer += state.dump;
			if (explicitPair) pairBuffer += generateNextLine(state, level);
			if (!writeNode(state, level + 1, objectValue, true, explicitPair)) continue;
			if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += ":";
			else pairBuffer += ": ";
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = _result || "{}";
	}
	function detectType(state, object, explicit) {
		var _result, typeList, index, length, type$1, style;
		typeList = explicit ? state.explicitTypes : state.implicitTypes;
		for (index = 0, length = typeList.length; index < length; index += 1) {
			type$1 = typeList[index];
			if ((type$1.instanceOf || type$1.predicate) && (!type$1.instanceOf || typeof object === "object" && object instanceof type$1.instanceOf) && (!type$1.predicate || type$1.predicate(object))) {
				state.tag = explicit ? type$1.tag : "?";
				if (type$1.represent) {
					style = state.styleMap[type$1.tag] || type$1.defaultStyle;
					if (_toString.call(type$1.represent) === "[object Function]") _result = type$1.represent(object, style);
					else if (_hasOwnProperty.call(type$1.represent, style)) _result = type$1.represent[style](object, style);
					else throw new YAMLException("!<" + type$1.tag + "> tag resolver accepts not \"" + style + "\" style");
					state.dump = _result;
				}
				return true;
			}
		}
		return false;
	}
	function writeNode(state, level, object, block, compact, iskey) {
		state.tag = null;
		state.dump = object;
		if (!detectType(state, object, false)) detectType(state, object, true);
		var type$1 = _toString.call(state.dump);
		if (block) block = state.flowLevel < 0 || state.flowLevel > level;
		var objectOrArray = type$1 === "[object Object]" || type$1 === "[object Array]", duplicateIndex, duplicate;
		if (objectOrArray) {
			duplicateIndex = state.duplicates.indexOf(object);
			duplicate = duplicateIndex !== -1;
		}
		if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) compact = false;
		if (duplicate && state.usedDuplicates[duplicateIndex]) state.dump = "*ref_" + duplicateIndex;
		else {
			if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) state.usedDuplicates[duplicateIndex] = true;
			if (type$1 === "[object Object]") if (block && Object.keys(state.dump).length !== 0) {
				writeBlockMapping(state, level, state.dump, compact);
				if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
			} else {
				writeFlowMapping(state, level, state.dump);
				if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
			}
			else if (type$1 === "[object Array]") {
				var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
				if (block && state.dump.length !== 0) {
					writeBlockSequence(state, arrayLevel, state.dump, compact);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
				} else {
					writeFlowSequence(state, arrayLevel, state.dump);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
				}
			} else if (type$1 === "[object String]") {
				if (state.tag !== "?") writeScalar(state, state.dump, level, iskey);
			} else {
				if (state.skipInvalid) return false;
				throw new YAMLException("unacceptable kind of an object to dump " + type$1);
			}
			if (state.tag !== null && state.tag !== "?") state.dump = "!<" + state.tag + "> " + state.dump;
		}
		return true;
	}
	function getDuplicateReferences(object, state) {
		var objects = [], duplicatesIndexes = [], index, length;
		inspectNode(object, objects, duplicatesIndexes);
		for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) state.duplicates.push(objects[duplicatesIndexes[index]]);
		state.usedDuplicates = new Array(length);
	}
	function inspectNode(object, objects, duplicatesIndexes) {
		var objectKeyList, index, length;
		if (object !== null && typeof object === "object") {
			index = objects.indexOf(object);
			if (index !== -1) {
				if (duplicatesIndexes.indexOf(index) === -1) duplicatesIndexes.push(index);
			} else {
				objects.push(object);
				if (Array.isArray(object)) for (index = 0, length = object.length; index < length; index += 1) inspectNode(object[index], objects, duplicatesIndexes);
				else {
					objectKeyList = Object.keys(object);
					for (index = 0, length = objectKeyList.length; index < length; index += 1) inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
				}
			}
		}
	}
	function dump(input, options) {
		options = options || {};
		var state = new State(options);
		if (!state.noRefs) getDuplicateReferences(input, state);
		if (writeNode(state, 0, input, true, true)) return state.dump + "\n";
		return "";
	}
	function safeDump(input, options) {
		return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
	}
	module.exports.dump = dump;
	module.exports.safeDump = safeDump;
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml.js
var require_js_yaml$1 = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/lib/js-yaml.js"(exports, module) {
	var loader = require_loader();
	var dumper = require_dumper();
	function deprecated(name) {
		return function() {
			throw new Error("Function " + name + " is deprecated and cannot be used.");
		};
	}
	module.exports.Type = require_type();
	module.exports.Schema = require_schema();
	module.exports.FAILSAFE_SCHEMA = require_failsafe();
	module.exports.JSON_SCHEMA = require_json();
	module.exports.CORE_SCHEMA = require_core();
	module.exports.DEFAULT_SAFE_SCHEMA = require_default_safe();
	module.exports.DEFAULT_FULL_SCHEMA = require_default_full();
	module.exports.load = loader.load;
	module.exports.loadAll = loader.loadAll;
	module.exports.safeLoad = loader.safeLoad;
	module.exports.safeLoadAll = loader.safeLoadAll;
	module.exports.dump = dumper.dump;
	module.exports.safeDump = dumper.safeDump;
	module.exports.YAMLException = require_exception();
	module.exports.MINIMAL_SCHEMA = require_failsafe();
	module.exports.SAFE_SCHEMA = require_default_safe();
	module.exports.DEFAULT_SCHEMA = require_default_full();
	module.exports.scan = deprecated("scan");
	module.exports.parse = deprecated("parse");
	module.exports.compose = deprecated("compose");
	module.exports.addConstructor = deprecated("addConstructor");
} });

//#endregion
//#region ../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/index.js
var require_js_yaml = __commonJS({ "../../node_modules/.pnpm/js-yaml@3.14.2/node_modules/js-yaml/index.js"(exports, module) {
	var yaml$1 = require_js_yaml$1();
	module.exports = yaml$1;
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/engines.js
var require_engines = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/engines.js"(exports, module) {
	const yaml = require_js_yaml();
	/**
	* Default engines
	*/
	const engines$2 = exports = module.exports;
	/**
	* YAML
	*/
	engines$2.yaml = {
		parse: yaml.safeLoad.bind(yaml),
		stringify: yaml.safeDump.bind(yaml)
	};
	/**
	* JSON
	*/
	engines$2.json = {
		parse: JSON.parse.bind(JSON),
		stringify: function(obj, options) {
			const opts = Object.assign({
				replacer: null,
				space: 2
			}, options);
			return JSON.stringify(obj, opts.replacer, opts.space);
		}
	};
	/**
	* JavaScript
	*/
	engines$2.javascript = {
		parse: function parse$1(str$1, options, wrap) {
			try {
				if (wrap !== false) str$1 = "(function() {\nreturn " + str$1.trim() + ";\n}());";
				return eval(str$1) || {};
			} catch (err$1) {
				if (wrap !== false && /(unexpected|identifier)/i.test(err$1.message)) return parse$1(str$1, options, false);
				throw new SyntaxError(err$1);
			}
		},
		stringify: function() {
			throw new Error("stringifying JavaScript is not supported");
		}
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/strip-bom-string@1.0.0/node_modules/strip-bom-string/index.js
var require_strip_bom_string = __commonJS({ "../../node_modules/.pnpm/strip-bom-string@1.0.0/node_modules/strip-bom-string/index.js"(exports, module) {
	module.exports = function(str$1) {
		if (typeof str$1 === "string" && str$1.charAt(0) === "﻿") return str$1.slice(1);
		return str$1;
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/utils.js
var require_utils = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/utils.js"(exports) {
	const stripBom = require_strip_bom_string();
	const typeOf$2 = require_kind_of();
	exports.define = function(obj, key, val) {
		Reflect.defineProperty(obj, key, {
			enumerable: false,
			configurable: true,
			writable: true,
			value: val
		});
	};
	/**
	* Returns true if `val` is a buffer
	*/
	exports.isBuffer = function(val) {
		return typeOf$2(val) === "buffer";
	};
	/**
	* Returns true if `val` is an object
	*/
	exports.isObject = function(val) {
		return typeOf$2(val) === "object";
	};
	/**
	* Cast `input` to a buffer
	*/
	exports.toBuffer = function(input) {
		return typeof input === "string" ? Buffer.from(input) : input;
	};
	/**
	* Cast `val` to a string.
	*/
	exports.toString = function(input) {
		if (exports.isBuffer(input)) return stripBom(String(input));
		if (typeof input !== "string") throw new TypeError("expected input to be a string or buffer");
		return stripBom(input);
	};
	/**
	* Cast `val` to an array.
	*/
	exports.arrayify = function(val) {
		return val ? Array.isArray(val) ? val : [val] : [];
	};
	/**
	* Returns true if `str` starts with `substr`.
	*/
	exports.startsWith = function(str$1, substr, len) {
		if (typeof len !== "number") len = substr.length;
		return str$1.slice(0, len) === substr;
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/defaults.js
var require_defaults = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/defaults.js"(exports, module) {
	const engines$1 = require_engines();
	const utils$2 = require_utils();
	module.exports = function(options) {
		const opts = Object.assign({}, options);
		opts.delimiters = utils$2.arrayify(opts.delims || opts.delimiters || "---");
		if (opts.delimiters.length === 1) opts.delimiters.push(opts.delimiters[0]);
		opts.language = (opts.language || opts.lang || "yaml").toLowerCase();
		opts.engines = Object.assign({}, engines$1, opts.parsers, opts.engines);
		return opts;
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/engine.js
var require_engine = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/engine.js"(exports, module) {
	module.exports = function(name, options) {
		let engine = options.engines[name] || options.engines[aliase(name)];
		if (typeof engine === "undefined") throw new Error("gray-matter engine \"" + name + "\" is not registered");
		if (typeof engine === "function") engine = { parse: engine };
		return engine;
	};
	function aliase(name) {
		switch (name.toLowerCase()) {
			case "js":
			case "javascript": return "javascript";
			case "coffee":
			case "coffeescript":
			case "cson": return "coffee";
			case "yaml":
			case "yml": return "yaml";
			default: return name;
		}
	}
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/stringify.js
var require_stringify = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/stringify.js"(exports, module) {
	const typeOf$1 = require_kind_of();
	const getEngine$1 = require_engine();
	const defaults$3 = require_defaults();
	module.exports = function(file, data, options) {
		if (data == null && options == null) switch (typeOf$1(file)) {
			case "object":
				data = file.data;
				options = {};
				break;
			case "string": return file;
			default: throw new TypeError("expected file to be a string or object");
		}
		const str$1 = file.content;
		const opts = defaults$3(options);
		if (data == null) {
			if (!opts.data) return file;
			data = opts.data;
		}
		const language = file.language || opts.language;
		const engine = getEngine$1(language, opts);
		if (typeof engine.stringify !== "function") throw new TypeError("expected \"" + language + ".stringify\" to be a function");
		data = Object.assign({}, file.data, data);
		const open = opts.delimiters[0];
		const close = opts.delimiters[1];
		const matter$2 = engine.stringify(data, options).trim();
		let buf = "";
		if (matter$2 !== "{}") buf = newline(open) + newline(matter$2) + newline(close);
		if (typeof file.excerpt === "string" && file.excerpt !== "") {
			if (str$1.indexOf(file.excerpt.trim()) === -1) buf += newline(file.excerpt) + newline(close);
		}
		return buf + newline(str$1);
	};
	function newline(str$1) {
		return str$1.slice(-1) !== "\n" ? str$1 + "\n" : str$1;
	}
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/excerpt.js
var require_excerpt = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/excerpt.js"(exports, module) {
	const defaults$2 = require_defaults();
	module.exports = function(file, options) {
		const opts = defaults$2(options);
		if (file.data == null) file.data = {};
		if (typeof opts.excerpt === "function") return opts.excerpt(file, opts);
		const sep = file.data.excerpt_separator || opts.excerpt_separator;
		if (sep == null && (opts.excerpt === false || opts.excerpt == null)) return file;
		const delimiter = typeof opts.excerpt === "string" ? opts.excerpt : sep || opts.delimiters[0];
		const idx = file.content.indexOf(delimiter);
		if (idx !== -1) file.excerpt = file.content.slice(0, idx);
		return file;
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/to-file.js
var require_to_file = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/to-file.js"(exports, module) {
	const typeOf = require_kind_of();
	const stringify$1 = require_stringify();
	const utils$1 = require_utils();
	/**
	* Normalize the given value to ensure an object is returned
	* with the expected properties.
	*/
	module.exports = function(file) {
		if (typeOf(file) !== "object") file = { content: file };
		if (typeOf(file.data) !== "object") file.data = {};
		if (file.contents && file.content == null) file.content = file.contents;
		utils$1.define(file, "orig", utils$1.toBuffer(file.content));
		utils$1.define(file, "language", file.language || "");
		utils$1.define(file, "matter", file.matter || "");
		utils$1.define(file, "stringify", function(data, options) {
			if (options && options.language) file.language = options.language;
			return stringify$1(file, data, options);
		});
		file.content = utils$1.toString(file.content);
		file.isEmpty = false;
		file.excerpt = "";
		return file;
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/parse.js
var require_parse = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/lib/parse.js"(exports, module) {
	const getEngine = require_engine();
	const defaults$1 = require_defaults();
	module.exports = function(language, str$1, options) {
		const opts = defaults$1(options);
		const engine = getEngine(language, opts);
		if (typeof engine.parse !== "function") throw new TypeError("expected \"" + language + ".parse\" to be a function");
		return engine.parse(str$1, opts);
	};
} });

//#endregion
//#region ../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/index.js
var require_gray_matter = __commonJS({ "../../node_modules/.pnpm/gray-matter@4.0.3/node_modules/gray-matter/index.js"(exports, module) {
	const fs$1 = require("fs");
	const sections = require_section_matter();
	const defaults = require_defaults();
	const stringify = require_stringify();
	const excerpt = require_excerpt();
	const engines = require_engines();
	const toFile = require_to_file();
	const parse = require_parse();
	const utils = require_utils();
	/**
	* Takes a string or object with `content` property, extracts
	* and parses front-matter from the string, then returns an object
	* with `data`, `content` and other [useful properties](#returned-object).
	*
	* ```js
	* const matter = require('gray-matter');
	* console.log(matter('---\ntitle: Home\n---\nOther stuff'));
	* //=> { data: { title: 'Home'}, content: 'Other stuff' }
	* ```
	* @param {Object|String} `input` String, or object with `content` string
	* @param {Object} `options`
	* @return {Object}
	* @api public
	*/
	function matter$1(input, options) {
		if (input === "") return {
			data: {},
			content: input,
			excerpt: "",
			orig: input
		};
		let file = toFile(input);
		const cached = matter$1.cache[file.content];
		if (!options) {
			if (cached) {
				file = Object.assign({}, cached);
				file.orig = cached.orig;
				return file;
			}
			matter$1.cache[file.content] = file;
		}
		return parseMatter(file, options);
	}
	/**
	* Parse front matter
	*/
	function parseMatter(file, options) {
		const opts = defaults(options);
		const open = opts.delimiters[0];
		const close = "\n" + opts.delimiters[1];
		let str$1 = file.content;
		if (opts.language) file.language = opts.language;
		const openLen = open.length;
		if (!utils.startsWith(str$1, open, openLen)) {
			excerpt(file, opts);
			return file;
		}
		if (str$1.charAt(openLen) === open.slice(-1)) return file;
		str$1 = str$1.slice(openLen);
		const len = str$1.length;
		const language = matter$1.language(str$1, opts);
		if (language.name) {
			file.language = language.name;
			str$1 = str$1.slice(language.raw.length);
		}
		let closeIndex = str$1.indexOf(close);
		if (closeIndex === -1) closeIndex = len;
		file.matter = str$1.slice(0, closeIndex);
		const block = file.matter.replace(/^\s*#[^\n]+/gm, "").trim();
		if (block === "") {
			file.isEmpty = true;
			file.empty = file.content;
			file.data = {};
		} else file.data = parse(file.language, file.matter, opts);
		if (closeIndex === len) file.content = "";
		else {
			file.content = str$1.slice(closeIndex + close.length);
			if (file.content[0] === "\r") file.content = file.content.slice(1);
			if (file.content[0] === "\n") file.content = file.content.slice(1);
		}
		excerpt(file, opts);
		if (opts.sections === true || typeof opts.section === "function") sections(file, opts.section);
		return file;
	}
	/**
	* Expose engines
	*/
	matter$1.engines = engines;
	/**
	* Stringify an object to YAML or the specified language, and
	* append it to the given string. By default, only YAML and JSON
	* can be stringified. See the [engines](#engines) section to learn
	* how to stringify other languages.
	*
	* ```js
	* console.log(matter.stringify('foo bar baz', {title: 'Home'}));
	* // results in:
	* // ---
	* // title: Home
	* // ---
	* // foo bar baz
	* ```
	* @param {String|Object} `file` The content string to append to stringified front-matter, or a file object with `file.content` string.
	* @param {Object} `data` Front matter to stringify.
	* @param {Object} `options` [Options](#options) to pass to gray-matter and [js-yaml].
	* @return {String} Returns a string created by wrapping stringified yaml with delimiters, and appending that to the given string.
	* @api public
	*/
	matter$1.stringify = function(file, data, options) {
		if (typeof file === "string") file = matter$1(file, options);
		return stringify(file, data, options);
	};
	/**
	* Synchronously read a file from the file system and parse
	* front matter. Returns the same object as the [main function](#matter).
	*
	* ```js
	* const file = matter.read('./content/blog-post.md');
	* ```
	* @param {String} `filepath` file path of the file to read.
	* @param {Object} `options` [Options](#options) to pass to gray-matter.
	* @return {Object} Returns [an object](#returned-object) with `data` and `content`
	* @api public
	*/
	matter$1.read = function(filepath, options) {
		const str$1 = fs$1.readFileSync(filepath, "utf8");
		const file = matter$1(str$1, options);
		file.path = filepath;
		return file;
	};
	/**
	* Returns true if the given `string` has front matter.
	* @param  {String} `string`
	* @param  {Object} `options`
	* @return {Boolean} True if front matter exists.
	* @api public
	*/
	matter$1.test = function(str$1, options) {
		return utils.startsWith(str$1, defaults(options).delimiters[0]);
	};
	/**
	* Detect the language to use, if one is defined after the
	* first front-matter delimiter.
	* @param  {String} `string`
	* @param  {Object} `options`
	* @return {Object} Object with `raw` (actual language string), and `name`, the language with whitespace trimmed
	*/
	matter$1.language = function(str$1, options) {
		const opts = defaults(options);
		const open = opts.delimiters[0];
		if (matter$1.test(str$1)) str$1 = str$1.slice(open.length);
		const language = str$1.slice(0, str$1.search(/\r?\n/));
		return {
			raw: language,
			name: language ? language.trim() : ""
		};
	};
	/**
	* Expose `matter`
	*/
	matter$1.cache = {};
	matter$1.clearCache = function() {
		matter$1.cache = {};
	};
	module.exports = matter$1;
} });

//#endregion
//#region src/cli/computers/yaml-parser.computer.ts
var import_gray_matter = __toESM(require_gray_matter(), 1);
/**
* Create a YAML parser computer.
*
* @returns A YamlParserComputer instance.
*/
function createYamlParserComputer() {
	function parseFrontmatter(content) {
		const { data, content: body } = (0, import_gray_matter.default)(content);
		return {
			data,
			content: body
		};
	}
	function parseYaml(content) {
		return load$2(content);
	}
	function validateYaml(content) {
		load$2(content);
		return true;
	}
	return {
		parseFrontmatter,
		parseYaml,
		validateYaml
	};
}

//#endregion
//#region src/cli/orchestrator.ts
/**
* Create and configure the CLI application.
*
* @returns The configured CLI orchestrator.
*/
function createCliOrchestrator() {
	const fs$3 = createFileSystemCapability();
	const xmlParser = createXmlParserComputer();
	const yamlParser = createYamlParserComputer();
	const search = createSearchComputer();
	const graphComputer = createGraphComputer();
	const taskResolver = createTaskResolverComputer();
	const validation = createValidationComputer();
	const taskHandler = createTaskHandler({
		fs: fs$3,
		xmlParser,
		taskResolver
	});
	const specHandler = createSpecHandler({
		fs: fs$3,
		xmlParser,
		taskResolver
	});
	const quickHandler = createQuickHandler({
		fs: fs$3,
		xmlParser
	});
	const searchHandler = createSearchHandler({
		fs: fs$3,
		yamlParser,
		search,
		graph: graphComputer
	});
	const docsHandler = createDocsHandler({
		fs: fs$3,
		yamlParser
	});
	const validationHandler = createValidationHandler({
		fs: fs$3,
		yamlParser,
		validation,
		taskResolver
	});
	const configHandler = createConfigHandler({
		fs: fs$3,
		yamlParser
	});
	const queryHandler = createQueryHandler({
		fs: fs$3,
		yamlParser,
		xmlParser
	});
	const projectHandler = createProjectHandler({
		fs: fs$3,
		xmlParser
	});
	const registry = createCommandRegistry();
	for (const command of taskHandler.getCommands()) registry.register(command);
	for (const command of specHandler.getCommands()) registry.register(command);
	for (const command of quickHandler.getCommands()) registry.register(command);
	for (const command of searchHandler.getCommands()) registry.register(command);
	for (const command of docsHandler.getCommands()) registry.register(command);
	for (const command of validationHandler.getCommands()) registry.register(command);
	for (const command of configHandler.getCommands()) registry.register(command);
	for (const command of queryHandler.getCommands()) registry.register(command);
	for (const command of projectHandler.getCommands()) registry.register(command);
	return { registry };
}

//#endregion
//#region src/cli/dispatcher.ts
/**
* Main dispatcher function.
*/
function main() {
	const args = process.argv.slice(2);
	const orchestrator = createCliOrchestrator();
	const { registry } = orchestrator;
	const getHelpOutput = () => ({
		usage: "festina <command> [args...]",
		commands: registry.list().map((cmd) => ({
			name: cmd.name,
			description: cmd.description,
			usage: cmd.usage
		}))
	});
	if (args.length === 0) {
		console.log(JSON.stringify(getHelpOutput(), null, 2));
		return;
	}
	const commandName = args[0];
	const commandArgs = args.slice(1);
	if (commandName === "help" || commandName === "--help" || commandName === "-h") {
		console.log(JSON.stringify(getHelpOutput(), null, 2));
		return;
	}
	const result = executeCommand(registry, commandName, commandArgs);
	if (isError$1(result)) {
		console.log(JSON.stringify(result, null, 2));
		process.exit(1);
	}
	console.log(JSON.stringify(result.data, null, 2));
}
main();

//#endregion