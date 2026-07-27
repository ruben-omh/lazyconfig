import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const srcDir = resolve(rootDir, "src");
const nmDir = resolve(rootDir, "node_modules");

mkdirSync(resolve(srcDir, "tsconfig"), { recursive: true });

const copies = [
	// [from-segments, to-segments]
	[
		["@lazyconfig", "tsconfig", "base.json"],
		["tsconfig", "base.json"],
	],
	[
		["@lazyconfig", "tsconfig", "lib.json"],
		["tsconfig", "lib.json"],
	],
	[
		["@lazyconfig", "tsconfig", "node.json"],
		["tsconfig", "node.json"],
	],
	[
		["@lazyconfig", "tsconfig", "react.json"],
		["tsconfig", "react.json"],
	],
	[
		["@lazyconfig", "tsconfig", "env.d.ts"],
		["tsconfig", "env.d.ts"],
	],
	[["@lazyconfig", "api-extractor", "base.json"], ["api-extractor.json"]],
	[["@lazyconfig", "prettier", "base.json"], ["prettier.json"]],
	[["@lazyconfig", "commitlint", "base.json"], ["commitlint.json"]],
];

for (const [from, to] of copies) {
	copyFileSync(join(nmDir, ...from), join(srcDir, ...to));
}
