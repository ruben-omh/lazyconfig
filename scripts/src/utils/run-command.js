"use strict";

const { execFileSync, spawn } = require("node:child_process");
const createLogger = require("./logger");

/**
 * Wraps `spawn` in a Promise. Resolves with trimmed stdout on exit code 0.
 * When `stdio` is `"inherit"`, output streams to the terminal and resolves as an empty string.
 * Rejects with the trimmed stderr content (or a fallback message) on non-zero exit.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {import("node:child_process").StdioOptions} stdio
 * @param {BufferEncoding} encoding
 * @returns {Promise<string>}
 */
function spawnAsync(command, args, stdio, encoding) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio });
		let stdout = "";
		let stderr = "";

		if (child.stdout) {
			child.stdout.setEncoding(encoding);
			child.stdout.on("data", (chunk) => {
				stdout += chunk;
			});
		}

		if (child.stderr) {
			child.stderr.setEncoding(encoding);
			child.stderr.on("data", (chunk) => {
				stderr += chunk;
			});
		}

		child.on("close", (code) => {
			if (code === 0) {
				resolve(stdout.trim());
			} else {
				reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
			}
		});

		child.on("error", reject);
	});
}

/**
 * Executes a command asynchronously and resolves with its trimmed stdout.
 *
 * When `stdio` is `"inherit"`, output streams directly to the terminal and is not captured —
 * the promise resolves with an empty string instead.
 *
 * On failure:
 * - If `opts.error.silent` is `true`, re-throws the raw error for the caller to handle.
 * - Otherwise, logs a descriptive message to stderr and exits with code 1.
 *
 * @param {string} command - The executable to run (e.g. `"git"`).
 * @param {string[]} args - Arguments passed to the executable.
 * @param {{ stdio?: import("node:child_process").StdioOptions, encoding?: BufferEncoding, error?: { message?: string, silent?: boolean, example?: string } }} opts
 * @returns {Promise<string>}
 */
async function runCommand(command, args, opts = {}) {
	const { stdio = "pipe", encoding = "utf-8", error } = opts;
	const logger = createLogger("run-command");

	try {
		logger.start(`Running "${command} ${args.join(" ")}" ...`);
		const output = await spawnAsync(command, args, stdio, encoding);
		logger.success(`"${command} ${args.join(" ")}" succeeded.`);
		return output;
	} catch (err) {
		const { message, example, silent = false } = error ?? {};

		if (silent) {
			logger.warn(`"${command} ${args.join(" ")}" failed silently.`);
			throw err;
		}

		logger.error(message ?? err);
		if (example) {
			logger.box(`Run "${example}" manually to see the full error.`);
		}

		process.exit(1);
	}
}

/**
 * Executes a command synchronously and returns its trimmed stdout.
 *
 * When `stdio` is `"inherit"`, output streams directly to the terminal and is not captured —
 * an empty string is returned instead.
 *
 * On failure:
 * - If `opts.error.silent` is `true`, re-throws the raw error for the caller to handle.
 * - Otherwise, logs a descriptive message to stderr and exits with code 1.
 *
 * @param {string} command - The executable to run (e.g. `"git"`).
 * @param {string[]} args - Arguments passed to the executable.
 * @param {{ stdio?: import("node:child_process").StdioOptions, encoding?: BufferEncoding, error?: { message?: string, silent?: boolean, example?: string } }} opts
 * @returns {string}
 */
function runCommandSync(command, args, opts = {}) {
	const { stdio = "pipe", encoding = "utf-8", error } = opts;
	const logger = createLogger("run-command-sync");

	try {
		logger.start(`Running "${command} ${args.join(" ")}" ...`);
		const output = execFileSync(command, args, { stdio, encoding });
		logger.success(`"${command} ${args.join(" ")}" succeeded.`);
		return (output ?? "").toString().trim();
	} catch (err) {
		const { message, example, silent = false } = error ?? {};

		if (silent) {
			logger.warn(`"${command} ${args.join(" ")}" failed silently.`);
			throw err;
		}

		logger.error(message ?? err);
		if (example) {
			logger.box(`Run "${example}" manually to see the full error.`);
		}

		process.exit(1);
	}
}

module.exports = { runCommand, runCommandSync };
