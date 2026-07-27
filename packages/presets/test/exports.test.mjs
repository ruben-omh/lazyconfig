import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(resolve(pkgRoot, "package.json"), "utf8"));

// --- helpers ---

// Flatten the `exports` map to a list of { subpath, condition, file } rows so
// each leaf file is asserted individually. Conditional entries (types/default)
// become one row per condition; string entries become a single row.
const flattenExports = (exportsMap) => {
	const rows = [];
	for (const [subpath, value] of Object.entries(exportsMap)) {
		if (typeof value === "string") {
			rows.push({ subpath, condition: null, file: value });
			continue;
		}
		for (const [condition, file] of Object.entries(value)) {
			if (typeof file !== "string") {
				throw new TypeError(
					`Nested conditional in exports["${subpath}"] is not supported by this smoke test`,
				);
			}
			rows.push({ subpath, condition, file });
		}
	}
	return rows;
};

const label = ({ subpath, condition }) =>
	condition ? `"${subpath}" (${condition})` : `"${subpath}"`;

const targets = flattenExports(pkg.exports);

// JS shims are expected to surface defineConfig from the source preset. The
// JSON/d.ts conditions are validated separately by the file-exists checks.
const jsShims = [
	{ subpath: "./eslint", file: "./src/eslint.js" },
	{ subpath: "./jest", file: "./src/jest.js" },
	{ subpath: "./rollup", file: "./src/rollup.js" },
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
	test(`shim ${shim.subpath} re-exports defineConfig from its source preset`, async () => {
		const abs = resolve(pkgRoot, shim.file);
		const mod = await import(pathToFileURL(abs).href);
		assert.equal(
			typeof mod.defineConfig,
			"function",
			`${shim.file} must re-export defineConfig — got ${typeof mod.defineConfig}`,
		);
	});
}
