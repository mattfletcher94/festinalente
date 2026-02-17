#!/usr/bin/env node

//#region src/scripts/get-date-time.ts
function main() {
	const now = new Date();
	const result = {
		iso: now.toISOString(),
		date: now.toISOString().split("T")[0]
	};
	console.log(JSON.stringify(result, null, 2));
}
main();

//#endregion