import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";

/** @type {import('rollup').RollupOptions} */
const config = {
	input: "src/index.ts",

	// All runtime dependencies stay external — consumers install them separately.
	external: ["rollup", /^@rollup\//],

	plugins: [
		babel({
			babelHelpers: "bundled",
			extensions: [".ts", ".tsx"],
			plugins: ["annotate-pure-calls"],
		}),
		nodeResolve({ extensions: [".ts", ".tsx"] }),
	],

	output: [
		{
			file: "dist/lazyconfig.rollup.index.mjs",
			format: "es",
		},
		{
			file: "dist/lazyconfig.rollup.index.cjs",
			format: "cjs",
			exports: "auto",
		},
	],
};

export default config;
