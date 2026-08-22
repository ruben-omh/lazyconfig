import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runCommand } from "../../../../helpers/run-command";
import type { TypesOptions } from "../../../../types";
import { createLogger } from "../../../../helpers/log";

/** The subset of api-extractor's prepared `ExtractorConfig` this script reads. */
interface PreparedExtractorConfig {
	rollupEnabled: boolean;
	untrimmedFilePath: string;
	publicTrimmedFilePath: string;
	betaTrimmedFilePath: string;
	alphaTrimmedFilePath: string;
}

interface ApiExtractorNamespace {
	ExtractorConfig: { loadFileAndPrepare: (configPath: string) => PreparedExtractorConfig };
}

/**
 * Resolves the declaration rollup that api-extractor just wrote for `configPath`,
 * or `undefined` when the config emits no rollup at all.
 *
 * Delegates to api-extractor's own `ExtractorConfig` rather than parsing the JSON here,
 * so `extends` chains, every `<token>`, and `projectFolder` resolve exactly as they did
 * during the `api-extractor run` that produced the file. The library is loaded from the
 * consumer's project — `compile types` already shells out to its binary, so it is
 * necessarily installed there.
 */
function resolveDtsRollupPath(
	configPath: string,
	logger: ReturnType<typeof createLogger>,
): string | undefined {
	const requireFromProject = createRequire(resolve(process.cwd(), "noop.js"));

	let apiExtractor: ApiExtractorNamespace;
	try {
		apiExtractor = requireFromProject("@microsoft/api-extractor") as ApiExtractorNamespace;
	} catch {
		logger.error(
			'"@microsoft/api-extractor" could not be resolved from this project, so --ext cannot ' +
				"determine where the declaration rollup was written.\n" +
				"Run: pnpm add -D @microsoft/api-extractor",
		);
		process.exit(1);
	}

	const config = apiExtractor.ExtractorConfig.loadFileAndPrepare(resolve(configPath));
	if (!config.rollupEnabled) return undefined;

	return (
		config.untrimmedFilePath ||
		config.publicTrimmedFilePath ||
		config.betaTrimmedFilePath ||
		config.alphaTrimmedFilePath ||
		undefined
	);
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

			const dtsPath = resolveDtsRollupPath(config, logger);
			if (!dtsPath) {
				// Returning quietly would leave the dual-package "exports" map pointing at
				// .d.mts/.d.cts files that were never written — a break that only surfaces
				// downstream, after publish.
				logger.error(
					`--ext was requested but "${config}" produces no declaration rollup. ` +
						"Enable dtsRollup and set untrimmedFilePath (or one of the trimmed variants).",
				);
				process.exit(1);
			}

			await Promise.all(normalizedExts.map((e) => copyDtsToExt(dtsPath, e, logger)));
		}),
	);

	logger.success("Declaration files generated successfully.");
}
