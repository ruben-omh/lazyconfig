#!/usr/bin/env node
"use strict";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const { copyFile, readFile } = require("node:fs/promises");
const createLogger = require("./utils/logger");
const { runCommand } = require("./utils/run-command");

/**
 * Reads an api-extractor config file and resolves the `dtsRollup.untrimmedFilePath`
 * value to an absolute-ish path by substituting the `<projectFolder>` token.
 *
 * @param {string} configPath - Path to the `api-extractor.json` file.
 * @returns {Promise<string | undefined>} The resolved `.d.ts` output path, or
 *   `undefined` when `dtsRollup` is not configured in the file.
 */
async function resolveDtsRollupPath(configPath) {
	const raw = await readFile(configPath, "utf-8");
	const config = JSON.parse(raw);
	const filePath = config.dtsRollup?.untrimmedFilePath;
	if (!filePath) return undefined;
	const projectFolder = config.projectFolder ?? ".";
	return filePath.replace("<projectFolder>", projectFolder);
}

/** Strips any leading `.` or `.d.` from a user-provided extension token. */
function normalizeExt(ext) {
	return ext.replace(/^\.?(d\.)?/, "");
}

/**
 * Copies a `.d.ts` rollup to a `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`).
 * No-op when the target equals the source (e.g. `ext === "ts"`).
 */
async function copyDtsToExt(dtsPath, ext, logger) {
	const targetPath = dtsPath.replace(/\.d\.ts$/, `.d.${ext}`);
	if (targetPath === dtsPath) return;
	logger.info(`Copying ${dtsPath} → ${targetPath}...`);
	await copyFile(dtsPath, targetPath);
}

/**
 * Generates bundled TypeScript declaration files for a package.
 *
 * Runs all `tsc --emitDeclarationOnly` passes in parallel, then runs all
 * `api-extractor` passes in parallel. For each extension in `ext`, copies
 * each `.d.ts` rollup to a `.d.<ext>` counterpart (e.g. `.d.mts`, `.d.cts`).
 *
 * @param {{ tsc?: string[], aec?: string[], ext?: string[], mock?: boolean }} [opts]
 * @param {string[]} [opts.tsc] - Paths to tsconfig files passed to `tsc --emitDeclarationOnly`.
 *   Defaults to `["tsconfig.json"]`.
 * @param {string[]} [opts.aec] - Paths to `api-extractor.json` config files.
 *   Defaults to `["api-extractor.json"]`.
 * @param {string[]} [opts.ext] - Additional declaration extensions to emit alongside the base
 *   `.d.ts` rollup (e.g. `["mts", "cts"]`). Each entry produces a `.d.<ext>` copy. Tokens may
 *   be passed as `"mts"`, `".mts"`, or `".d.mts"`. Defaults to `[]`.
 * @param {boolean} [opts.mock] - When `true`, logs each step without executing any commands or
 *   copying files. Useful for verifying the script flow without side effects.
 * @returns {Promise<void>}
 */
async function buildTypes(opts = {}) {
	const { tsc = ["tsconfig.json"], aec = ["api-extractor.json"], ext = [], mock = false } = opts;
	const logger = createLogger("build-types");
	const normalizedExts = ext.map(normalizeExt);

	if (mock) {
		logger.box("Running in mock mode — no commands will be executed.");
	}

	// Step 1 — run all tsc passes in parallel
	logger.info(`Generating declaration files with tsc...`);
	await Promise.all(
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

	// Step 2 — run all api-extractor passes in parallel, then emit any extra .d.<ext> copies
	logger.info(`Bundling declarations with api-extractor...`);
	await Promise.all(
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
			const dtsPath = await resolveDtsRollupPath(config);
			if (!dtsPath) return;
			await Promise.all(normalizedExts.map((e) => copyDtsToExt(dtsPath, e, logger)));
		}),
	);

	logger.success(
		mock
			? "Mock run complete — no files were written."
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
	.fail((msg) => {
		const logger = createLogger("yargs-fail");
		logger.error(msg);
		process.exit(1);
	})
	.parse(hideBin(process.argv));
