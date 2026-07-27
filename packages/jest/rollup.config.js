import { defineConfig } from "@lazyconfig/rollup";

/** @type {import('@lazyconfig/rollup').DefineConfigOptions} */
const config = {
	bundles: [
		{
			input: "src/index.ts",
			file: "lazyconfig.jest.index",
		},
	],
	external: ["jest"],
	plugins: {
		node: true,
		babel: { plugins: ["annotate-pure-calls"] },
	},
	formats: {
		es: true,
		cjs: true,
	},
};

/** @type {import('rollup').RollupOptions[]} */
export default defineConfig(config);
