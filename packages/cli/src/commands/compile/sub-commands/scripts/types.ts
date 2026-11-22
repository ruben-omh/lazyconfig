import { copyFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runCommand } from "../../../../helpers/run-command";
import type { TypesOptions } from "../../../../types";
import { createLogger } from "../../../../helpers/log";

type Logger = ReturnType<typeof createLogger>;

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

/** Declaration extensions `--ext` accepts once normalized. */
const VALID_EXTS = new Set(["ts", "mts", "cts"]);

/** Matches relative module specifiers (`from "./x"`, `from "../x"`, `import("./x")`). */
const RELATIVE_IMPORT_RE = /\bfrom\s+["']\.\.?\/|\bimport\(\s*["']\.\.?\//;

/** Matches a default export (`export default ...` or `export { foo as default }`). */
const DEFAULT_EXPORT_RE = /^\s*export\s+default\b|\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/m;

/**
 * Resolves every declaration rollup that api-extractor just wrote for `configPath`
 * (untrimmed, public, beta and alpha), or an empty array when the config emits no rollup.
 *
 * Delegates to api-extractor's own `ExtractorConfig` rather than parsing the JSON here,
 * so `extends` chains, every `<token>`, and `projectFolder` resolve exactly as they did
 * during the `api-extractor run` that produced the files. The library is loaded from the
 * consumer's project - `compile types` already shells out to its binary, so it is
 * necessarily installed there.
 *
 * @throws When `@microsoft/api-extractor` cannot be resolved from the current project.
 */
function resolveDtsRollupPaths(configPath: string): string[] {
	const requireFromProject = createRequire(resolve(process.cwd(), "noop.js"));

	let apiExtractor: ApiExtractorNamespace;
	try {
		apiExtractor = requireFromProject("@microsoft/api-extractor") as ApiExtractorNamespace;
	} catch {
		throw new Error(
			'"@microsoft/api-extractor" could not be resolved from this project, so --ext cannot ' +
				"determine where the declaration rollup was written.\n" +
				"Run: pnpm add -D @microsoft/api-extractor",
		);
	}

	const config = apiExtractor.ExtractorConfig.loadFileAndPrepare(resolve(configPath));
	if (!config.rollupEnabled) return [];

	const paths = [
		config.untrimmedFilePath,
		config.publicTrimmedFilePath,
		config.betaTrimmedFilePath,
		config.alphaTrimmedFilePath,
	].filter((path): path is string => Boolean(path));

	return [...new Set(paths)];
}

/**
 * Strips any leading `.` or `.d.` from a user-provided extension token so
 * `"mts"`, `".mts"`, and `".d.mts"` all resolve to the same `mts` target.
 *
 * @throws When the normalized token is not one of `ts`, `mts` or `cts`.
 */
function normalizeExt(ext: string): string {
	const normalized = ext.replace(/^\.?(d\.)?/, "");
	if (!VALID_EXTS.has(normalized)) {
		throw new Error(
			`Invalid --ext value "${ext}". Expected one of: ${[...VALID_EXTS].join(", ")}.`,
		);
	}
	return normalized;
}

/**
 * Copies a `.d.ts` rollup to one `.d.<ext>` counterpart per entry in `exts`
 * (e.g. `.d.mts`, `.d.cts`).
 *
 * The content is copied verbatim; only the extension changes, which tells TypeScript
 * whether to treat the file as ESM (`.d.mts`) or CJS (`.d.cts`). Because of that, the
 * rollup is inspected first and a warning is emitted for the cases where a verbatim
 * copy is likely to produce incorrect types:
 *
 * - **Relative imports** - `.d.mts` files require explicit extensions on relative
 *   specifiers under `node16`/`nodenext`, and both copies would resolve to the same
 *   `.d.ts` target, whose module format only matches one of them.
 * - **Default export in a `.d.cts`** - only correct when the CJS build emits
 *   `exports.default = ...`. If it emits `module.exports = ...`, the `.d.cts` needs
 *   `export = ...` instead.
 *
 * Extensions that resolve to the source path (e.g. `ts`) are skipped.
 */
async function emitDtsVariants(dtsPath: string, exts: string[], logger: Logger): Promise<void> {
	if (!dtsPath.endsWith(".d.ts")) {
		logger.warn(
			`Skipping --ext copies for "${dtsPath}": the rollup does not end in .d.ts, ` +
				"so no .d.<ext> counterpart can be derived from it.",
		);
		return;
	}

	const targets = exts
		.map((ext) => ({ ext, targetPath: dtsPath.replace(/\.d\.ts$/, `.d.${ext}`) }))
		.filter(({ targetPath }) => targetPath !== dtsPath);
	if (targets.length === 0) return;

	const content = await readFile(dtsPath, "utf8");

	if (RELATIVE_IMPORT_RE.test(content)) {
		logger.warn(
			`"${dtsPath}" still contains relative imports. The copied .d.mts/.d.cts files may not ` +
				"resolve them correctly; consider bundling those modules into the rollup.",
		);
	}

	if (targets.some(({ ext }) => ext === "cts") && DEFAULT_EXPORT_RE.test(content)) {
		logger.warn(
			`"${dtsPath}" has a default export. The .d.cts copy is only correct if your CJS build ` +
				"emits `exports.default = ...`; if it emits `module.exports = ...`, the .d.cts must " +
				"use `export = ...` instead.",
		);
	}

	await Promise.all(
		targets.map(async ({ targetPath }) => {
			logger.info(`Copying ${dtsPath} -> ${targetPath}...`);
			await copyFile(dtsPath, targetPath);
		}),
	);
}

/**
 * Runs every task to completion and only then rethrows the first failure, so a failing
 * task never leaves sibling tasks (e.g. other api-extractor runs) half-written.
 */
async function settleAll(tasks: Promise<unknown>[]): Promise<void> {
	const results = await Promise.allSettled(tasks);
	const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
	if (failure) throw failure.reason;
}

/**
 * Generates bundled `.d.ts` declaration files for a TypeScript library.
 *
 * Runs two steps in sequence:
 * 1. `tsc` - emits raw `.d.ts` files in parallel for each tsconfig using `--emitDeclarationOnly`.
 * 2. `api-extractor run` - bundles and trims declarations in parallel for each api-extractor config,
 *    then, for each extension in `ext`, copies every `.d.ts` rollup (untrimmed and trimmed) to a
 *    `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`).
 *
 * Multiple tsconfig files are useful when a package exposes several entry points
 * (e.g. `tsconfig.lib.json` and `tsconfig.node.json`). Multiple api-extractor configs
 * allow producing separate declaration bundles for each entry point.
 *
 * The `.d.<ext>` copies are verbatim; validate the published package with
 * `npx @arethetypeswrong/cli --pack .` to confirm they match the runtime output.
 *
 * @param opts - Execution options.
 * @param opts.tsc   - List of tsconfig file paths passed to `tsc`. Defaults to `["tsconfig.json"]`.
 * @param opts.aec   - List of api-extractor config file paths. Defaults to `["api-extractor.json"]`.
 * @param opts.ext   - Additional declaration extensions to emit alongside the base `.d.ts`
 *                     rollup (`"mts"` and/or `"cts"`). Each entry produces a `.d.<ext>` copy.
 *                     Tokens may be passed as `"mts"`, `".mts"`, or `".d.mts"`. Defaults to `[]`.
 * @param opts.watch - When `true`, emits log messages for each step executed.
 *
 * @throws When an `--ext` value is invalid, when api-extractor cannot be resolved, or when
 *         `--ext` is requested for a config that produces no declaration rollup.
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

	// Validate --ext up front so a typo fails before any compilation work starts.
	const normalizedExts = [...new Set(ext.map(normalizeExt))];

	// Step 1 - run all tsc passes in parallel
	logger.info(`Generating declaration files with tsc...`);
	await settleAll(
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

	// Step 2 - run all api-extractor passes in parallel, then emit any extra .d.<ext> copies
	logger.info(`Bundling declarations with api-extractor...`);
	await settleAll(
		aec.map(async (config) => {
			await runCommand("api-extractor", ["run", "--config", config, "--local", "--verbose"], {
				stdio: "inherit",
				watch,
				error: {
					message: `api-extractor failed. Check your configuration at "${config}".`,
				},
			});

			if (normalizedExts.length === 0) return;

			const dtsPaths = resolveDtsRollupPaths(config);
			if (dtsPaths.length === 0) {
				// Returning quietly would leave the dual-package "exports" map pointing at
				// .d.mts/.d.cts files that were never written - a break that only surfaces
				// downstream, after publish.
				throw new Error(
					`--ext was requested but "${config}" produces no declaration rollup. ` +
						"Enable dtsRollup and set untrimmedFilePath (or one of the trimmed variants).",
				);
			}

			await Promise.all(
				dtsPaths.map((dtsPath) => emitDtsVariants(dtsPath, normalizedExts, logger)),
			);
		}),
	);

	logger.success("Declaration files generated successfully.");
}
