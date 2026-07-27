import { copyFile, readFile } from "node:fs/promises";
import { runCommand } from "../../../../helpers/run-command";
import type { TypesOptions } from "../../../../types";
import { createLogger } from "../../../../helpers/log";

/**
 * Reads the api-extractor config file and returns the resolved path to the
 * `dtsRollup.untrimmedFilePath` output file, or `undefined` if not configured.
 */
interface ApiExtractorConfig {
	projectFolder?: string;
	dtsRollup?: { untrimmedFilePath?: string };
}

async function resolveDtsRollupPath(configPath: string): Promise<string | undefined> {
	const raw = await readFile(configPath, "utf-8");
	const config = JSON.parse(raw) as ApiExtractorConfig;
	const filePath = config.dtsRollup?.untrimmedFilePath;
	if (!filePath) return undefined;
	const projectFolder = config.projectFolder ?? ".";
	return filePath.replace("<projectFolder>", projectFolder);
}

/**
 * Strips any leading `.` or `.d.` from a user-provided extension token so
 * `"mts"`, `".mts"`, and `".d.mts"` all resolve to the same `mts` target.
 */
function normalizeExt(ext: string): string {
	return ext.replace(/^\.?(d\.)?/, "");
}

/**
 * Copies a `.d.ts` rollup to a `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`).
 *
 * No-op when the target equals the source (e.g. `ext === "ts"`).
 */
async function copyDtsToExt(
	dtsPath: string,
	ext: string,
	logger: ReturnType<typeof createLogger>,
): Promise<void> {
	const targetPath = dtsPath.replace(/\.d\.ts$/, `.d.${ext}`);
	if (targetPath === dtsPath) return;
	logger.info(`Copying ${dtsPath} → ${targetPath}...`);
	await copyFile(dtsPath, targetPath);
}

/**
 * Generates bundled `.d.ts` declaration files for a TypeScript library.
 *
 * Runs two steps in sequence:
 * 1. `tsc` — emits raw `.d.ts` files in parallel for each tsconfig using `--emitDeclarationOnly`.
 * 2. `api-extractor run` — bundles and trims declarations in parallel for each api-extractor config,
 *    then, for each extension in `ext`, copies the `.d.ts` rollup to a `.d.<ext>` counterpart
 *    (e.g. `.d.mts`, `.d.cts`).
 *
 * Multiple tsconfig files are useful when a package exposes several entry points
 * (e.g. `tsconfig.lib.json` and `tsconfig.node.json`). Multiple api-extractor configs
 * allow producing separate declaration bundles for each entry point.
 *
 * @param opts - Execution options.
 * @param opts.tsc   - List of tsconfig file paths passed to `tsc`. Defaults to `["tsconfig.json"]`.
 * @param opts.aec   - List of api-extractor config file paths. Defaults to `["api-extractor.json"]`.
 * @param opts.ext   - Additional declaration extensions to emit alongside the base `.d.ts`
 *                     rollup (e.g. `["mts", "cts"]`). Each entry produces a `.d.<ext>` copy.
 *                     Tokens may be passed as `"mts"`, `".mts"`, or `".d.mts"`. Defaults to `[]`.
 * @param opts.watch - When `true`, emits log messages for each step executed.
 *
 * @example
 * ```sh
 * lazyconfig compile types
 * lazyconfig compile types -t tsconfig.json -t tsconfig.node.json
 * lazyconfig compile types -a api-extractor.json -a api-extractor.node.json
 * lazyconfig compile types -e mts -e cts
 * ```
 *
 * @example
 * ```ts
 * import { types } from "@lazyconfig/cli";
 *
 * await types();
 * await types({
 *   tsc: ["tsconfig.json", "tsconfig.node.json"],
 *   aec: ["api-extractor.json", "api-extractor.node.json"],
 *   ext: ["mts", "cts"],
 * });
 * ```
 */
export async function types(opts: TypesOptions = {}): Promise<void> {
	const { tsc = ["tsconfig.json"], aec = ["api-extractor.json"], ext = [], watch = false } = opts;
	const logger = createLogger("types", watch);
	const normalizedExts = ext.map(normalizeExt);

	// Step 1 — run all tsc passes in parallel
	logger.info(`Generating declaration files with tsc...`);
	await Promise.all(
		tsc.map((project) =>
			runCommand("tsc", ["--project", project, "--emitDeclarationOnly"], {
				stdio: "inherit",
				watch,
				error: {
					message: `tsc failed. Check your TypeScript configuration at "${project}".`,
				},
			}),
		),
	);

	// Step 2 — run all api-extractor passes in parallel, then emit any extra .d.<ext> copies
	logger.info(`Bundling declarations with api-extractor...`);
	await Promise.all(
		aec.map(async (config) => {
			await runCommand("api-extractor", ["run", "--config", config, "--local", "--verbose"], {
				stdio: "inherit",
				watch,
				error: {
					message: `api-extractor failed. Check your configuration at "${config}".`,
				},
			});

			if (normalizedExts.length === 0) return;
			const dtsPath = await resolveDtsRollupPath(config);
			if (!dtsPath) return;
			await Promise.all(normalizedExts.map((e) => copyDtsToExt(dtsPath, e, logger)));
		}),
	);

	logger.success("Declaration files generated successfully.");
}
