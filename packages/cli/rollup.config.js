import { defineConfig } from "@lazyconfig/rollup";

// Dynamic imports are used to lazily load script modules inside command handlers.
// Inlining them keeps each entry point as a single self-contained bundle.
const inlineDynamicImports = true;

/** @type {import('@lazyconfig/rollup').DefineConfigOptions} */
const config = {
	bundles: [
		{
			input: "src/cli.ts",
			file: "lazyconfig.cli",
		},
	],
	external: [/^node:/, "yargs", "yargs/helpers", "consola"],
	plugins: {
		node: true,
		babel: { plugins: ["annotate-pure-calls"] },
	},
	formats: {
		es: false,
		cjs: { output: { inlineDynamicImports } },
	},
};

/** @type {import('rollup').RollupOptions[]} */
export default defineConfig(config);
