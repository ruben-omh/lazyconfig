import type { TypesOptions, YargsCommandModule } from "../../../types";

/**
 * Yargs sub-command definition for `lazyconfig compile types`.
 * The script is lazy-loaded on invocation to keep startup time low.
 */
const command: YargsCommandModule<object, TypesOptions> = {
	command: "types",
	describe: "Generate a bundled .d.ts declaration file using tsc and api-extractor",

	builder: (yargs) =>
		yargs
			.option("tsc", {
				type: "string",
				array: true,
				alias: "t",
				describe: "Path to the tsconfig file passed to tsc.",
				default: ["tsconfig.json"],
			})
			.option("aec", {
				type: "string",
				array: true,
				alias: "a",
				describe: "Path to the api-extractor.json config file.",
				default: ["api-extractor.json"],
			})
			.option("ext", {
				type: "string",
				array: true,
				alias: "e",
				describe:
					"Additional declaration extensions to emit alongside .d.ts (e.g. mts, cts). Defaults to [].",
				default: [] as string[],
			})
			.option("watch", {
				type: "boolean",
				alias: "w",
				describe: "Emit log messages during execution. Defaults to false.",
			})
			.example("$0 compile types", "Generate declarations using default config files")
			.example(
				"$0 compile types --tsc tsconfig.build.json",
				"Use a custom tsconfig for declaration emit",
			)
			.example(
				"$0 compile types --ext mts --ext cts",
				"Also emit .d.mts and .d.cts copies for dual-package consumers",
			),

	handler: async (argv) => {
		const { types } = await import("./scripts/types");
		await types({ ...argv });
	},
};

export default command;
