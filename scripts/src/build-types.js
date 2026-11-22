#!/usr/bin/env node
"use strict";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { copyFile, readFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const createLogger = require("./utils/logger");
const { runCommand } = require("./utils/run-command");

/** Declaration extensions `--ext` accepts once normalized. */
const VALID_EXTS = new Set(["ts", "mts", "cts"]);

/** Matches relative module specifiers (`from "./x"`, `from "../x"`, `import("./x")`). */
const RELATIVE_IMPORT_RE = /\bfrom\s+["']\.\.?\/|\bimport\(\s*["']\.\.?\//;

/** Matches a default export (`export default ...` or `export { foo as default }`). */
const DEFAULT_EXPORT_RE = /^\s*export\s+default\b|\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/m;

/**
 * Resolves every declaration rollup api-extractor just wrote for `configPath`
 * (untrimmed, public, beta and alpha), or an empty array when the config emits none.
 *
 * Delegates to api-extractor's own `ExtractorConfig` rather than parsing the JSON here,
 * so `extends` chains, every `<token>`, and `projectFolder` resolve exactly as they did
 * during the `api-extractor run` that produced the files.
 *
 * Kept in step with packages/cli/src/commands/compile/sub-commands/scripts/types.ts -
 * this is the internal twin of the published `lazyconfig compile types` command.
 *
 * @param {string} configPath - Path to the `api-extractor.json` file.
 * @returns {string[]} The rollup paths, or an empty array when the config emits none.
 */
function resolveDtsRollupPaths(configPath) {
	const { ExtractorConfig } = require("@microsoft/api-extractor");
	const config = ExtractorConfig.loadFileAndPrepare(resolve(configPath));
	if (!config.rollupEnabled) return [];
	const paths = [
		config.untrimmedFilePath,
		config.publicTrimmedFilePath,
		config.betaTrimmedFilePath,
		config.alphaTrimmedFilePath,
	].filter(Boolean);
	return [...new Set(paths)];
}

/**
 * Strips any leading `.` or `.d.` from a user-provided extension token so
 * `"mts"`, `".mts"`, and `".d.mts"` all resolve to the same target.
 *
 * @throws When the normalized token is not one of `ts`, `mts` or `cts`.
 */
function normalizeExt(ext) {
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
 * The content is copied verbatim; only the extension changes. The rollup is inspected
 * first and a warning is emitted for the cases where a verbatim copy is likely to be
 * wrong: relative imports (`.d.mts`/`.d.cts` require different resolution), and a default
 * export in a `.d.cts` (only correct when the CJS build emits `exports.default = ...`).
 *
 * Extensions that resolve to the source path (e.g. `ts`) are skipped.
 */
async function emitDtsVariants(dtsPath, exts, logger) {
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
 *
 * @param {Promise<unknown>[]} tasks
 * @returns {Promise<void>}
 */
async function settleAll(tasks) {
	const results = await Promise.allSettled(tasks);
	const failure = results.find((r) => r.status === "rejected");
	if (failure) throw failure.reason;
}

/**
 * Generates bundled TypeScript declaration files for a package.
 *
 * Runs all `tsc --emitDeclarationOnly` passes in parallel, then runs all
 * `api-extractor` passes in parallel. For each extension in `ext`, copies
 * every `.d.ts` rollup (untrimmed and trimmed) to a `.d.<ext>` counterpart
 * (e.g. `.d.mts`, `.d.cts`).
 *
 * @param {{ tsc?: string[], aec?: string[], ext?: string[], mock?: boolean }} [opts]
 * @param {string[]} [opts.tsc] - Paths to tsconfig files passed to `tsc --emitDeclarationOnly`.
 *   Defaults to `["tsconfig.json"]`.
 * @param {string[]} [opts.aec] - Paths to `api-extractor.json` config files.
 *   Defaults to `["api-extractor.json"]`.
 * @param {string[]} [opts.ext] - Additional declaration extensions to emit alongside the base
 *   `.d.ts` rollup (`"mts"` and/or `"cts"`). Each entry produces a `.d.<ext>` copy. Tokens may
 *   be passed as `"mts"`, `".mts"`, or `".d.mts"`. Defaults to `[]`.
 * @param {boolean} [opts.mock] - When `true`, logs each step without executing any commands or
 *   copying files. Useful for verifying the script flow without side effects.
 * @returns {Promise<void>}
 * @throws When an `--ext` value is invalid, or when `--ext` is requested for a config that
 *   produces no declaration rollup.
 */
async function buildTypes(opts = {}) {
	const { tsc = ["tsconfig.json"], aec = ["api-extractor.json"], ext = [], mock = false } = opts;
	const logger = createLogger("build-types");

	// Validate --ext up front so a typo fails before any compilation work starts.
	const normalizedExts = [...new Set(ext.map(normalizeExt))];

	if (mock) {
		logger.box("Running in mock mode - no commands will be executed.");
	}

	// Step 1 - run all tsc passes in parallel
	logger.info(`Generating declaration files with tsc...`);
	await settleAll(
		tsc.map((project) => {
			if (mock) {
				logger.warn(`[mock] tsc --project ${project} --emitDeclarationOnly`);
				return Promise.resolve();
			}
			return runCommand("tsc", ["--project", project, "--emitDeclarationOnly"], {
				stdio: "inherit",
				error: {
					message: `tsc failed. Check your TypeScript configuration at "${project}".`,
				},
			});
		}),
	);

	// Step 2 - run all api-extractor passes in parallel, then emit any extra .d.<ext> copies
	logger.info(`Bundling declarations with api-extractor...`);
	await settleAll(
		aec.map(async (config) => {
			if (mock) {
				logger.warn(`[mock] api-extractor run --config ${config} --local --verbose`);
				for (const e of normalizedExts) {
					logger.warn(`[mock] cp <dtsRollup> <dtsRollup>.d.${e}  (from ${config})`);
				}
				return;
			}
			await runCommand("api-extractor", ["run", "--config", config, "--local", "--verbose"], {
				stdio: "inherit",
				error: {
					message: `api-extractor failed. Check your configuration at "${config}".`,
				},
			});

			if (normalizedExts.length === 0) return;

			const dtsPaths = resolveDtsRollupPaths(config);
			if (dtsPaths.length === 0) {
				// Returning quietly would leave the dual-package "exports" map pointing at
				// .d.mts/.d.cts files that were never written.
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

	logger.success(
		mock
			? "Mock run complete - no files were written."
			: "Declaration files generated successfully.",
	);
}

void yargs()
	.command({
		command: "$0",
		describe: "Generate a bundled .d.ts declaration file using tsc and api-extractor",

		builder: (y) =>
			y
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
					default: [],
				})
				.option("mock", {
					type: "boolean",
					alias: "m",
					describe: "Log each step without executing any commands or copying files.",
					default: false,
				}),

		handler: async (argv) => {
			await buildTypes({ ...argv });
		},
	})
	.strict()
	// `msg` is null when an async handler rejects - the real error is in `err`.
	.fail((msg, err) => {
		const logger = createLogger("yargs-fail");
		logger.error(msg ?? err);
		process.exit(1);
	})
	.parse(hideBin(process.argv));
