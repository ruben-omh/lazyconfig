import { defineConfig } from "@lazyconfig/rollup";

/** @type {import('@lazyconfig/rollup').DefineConfigOptions} */
const config = {
	bundles: [
		{
			input: "src/index.ts",
			file: "lazyconfig.eslint.index",
		},
	],
	external: [
		"eslint",
		"@eslint/js",
		"eslint-config-prettier",
		"eslint-plugin-jsx-a11y",
		"eslint-plugin-n",
		"eslint-plugin-react",
		"eslint-plugin-react-hooks",
		"globals",
		"typescript-eslint",
	],
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
