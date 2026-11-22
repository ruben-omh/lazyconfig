import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(resolve(pkgRoot, "package.json"), "utf8"));

// --- helpers ---

// Flatten the `exports` map to a list of { subpath, condition, file } rows so
// each leaf file is asserted individually. Condition objects may nest
// arbitrarily (e.g. `import` -> `{ types, default }`); each string leaf becomes
// one row, with `condition` tracking the dotted path of conditions traversed
// to reach it (e.g. "import.types"). String entries become a single row.
const flattenConditions = (subpath, value, path, rows) => {
	if (typeof value === "string") {
		rows.push({ subpath, condition: path.join(".") || null, file: value });
		return;
	}
	for (const [condition, nested] of Object.entries(value)) {
		flattenConditions(subpath, nested, [...path, condition], rows);
	}
};

const flattenExports = (exportsMap) => {
	const rows = [];
	for (const [subpath, value] of Object.entries(exportsMap)) {
		flattenConditions(subpath, value, [], rows);
	}
	return rows;
};

const label = ({ subpath, condition }) =>
	condition ? `"${subpath}" (${condition})` : `"${subpath}"`;

const targets = flattenExports(pkg.exports);

// JS shims are expected to surface defineConfig from the source preset, in both
// module formats. The JSON/d.ts conditions are validated separately by the
// file-exists checks.
const require = createRequire(import.meta.url);
const jsShims = [
	{ subpath: "./eslint", mjs: "./src/eslint.mjs", cjs: "./src/eslint.cjs" },
	{ subpath: "./jest", mjs: "./src/jest.mjs", cjs: "./src/jest.cjs" },
	{ subpath: "./rollup", mjs: "./src/rollup.mjs", cjs: "./src/rollup.cjs" },
];

// --- tests ---

test("exports map is non-empty", () => {
	assert.ok(targets.length > 0, "package.json has no exports entries");
});

for (const target of targets) {
	test(`exports ${label(target)} resolves to an existing file`, () => {
		const abs = resolve(pkgRoot, target.file);
		assert.ok(existsSync(abs), `missing file referenced by exports: ${target.file}`);
	});
}

for (const target of targets) {
	if (!target.file.endsWith(".json")) continue;
	test(`exports ${label(target)} is valid JSON`, async () => {
		const abs = resolve(pkgRoot, target.file);
		const raw = await readFile(abs, "utf8");
		assert.doesNotThrow(() => JSON.parse(raw), `exports target is not valid JSON: ${target.file}`);
	});
}

for (const shim of jsShims) {
	test(`shim ${shim.subpath} (esm) re-exports defineConfig from its source preset`, async () => {
		const abs = resolve(pkgRoot, shim.mjs);
		const mod = await import(pathToFileURL(abs).href);
		assert.equal(
			typeof mod.defineConfig,
			"function",
			`${shim.mjs} must re-export defineConfig — got ${typeof mod.defineConfig}`,
		);
	});

	test(`shim ${shim.subpath} (cjs) re-exports defineConfig from its source preset`, () => {
		const abs = resolve(pkgRoot, shim.cjs);
		const required = require(abs);
		assert.equal(
			typeof required.defineConfig,
			"function",
			`${shim.cjs} must re-export defineConfig — got ${typeof required.defineConfig}`,
		);
	});
}
