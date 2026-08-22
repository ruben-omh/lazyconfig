import { execFileSync, spawn } from "node:child_process";
import type { StdioOptions } from "node:child_process";
import type { CommandOptions } from "../types.js";
import { createLogger } from "./log.js";

/**
 * Wraps `spawn` in a Promise. Resolves with trimmed stdout on exit code 0.
 * When `stdio` is `"inherit"`, output streams to the terminal and stdout resolves as an empty string.
 * Rejects with the trimmed stderr content (or a fallback message) on non-zero exit.
 */
function spawnAsync(
	command: string,
	args: string[],
	stdio: StdioOptions,
	encoding: BufferEncoding,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio });
		let stdout = "";
		let stderr = "";

		if (child.stdout) {
			child.stdout.setEncoding(encoding);
			child.stdout.on("data", (chunk: string) => {
				stdout += chunk;
			});
		}

		if (child.stderr) {
			child.stderr.setEncoding(encoding);
			child.stderr.on("data", (chunk: string) => {
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
 * @param command - The executable to run (e.g. `"git"`).
 * @param args - Arguments passed to the executable (e.g. `["config", "user.name"]`).
 * @param opts - Execution options. `stdio` and `encoding` are forwarded to the child process;
 * `error` controls failure behaviour. Defaults to `encoding: "utf-8"` and `stdio: "pipe"`.
 * @returns A promise that resolves with the trimmed stdout, or an empty string when `stdio` is `"inherit"`.
 * @throws When the command fails and `opts.error.silent` is `true`.
 */
export async function runCommand(
	command: string,
	args: string[],
	opts: CommandOptions,
): Promise<string> {
	const { stdio = "pipe", encoding = "utf-8", watch = false, error } = opts;
	const logger = createLogger("run-command", watch);

	try {
		logger.start(`Running command "${command} ${args.join(" ")}" ...`);
		const output = await spawnAsync(command, args, stdio, encoding);
		logger.success(`Command "${command} ${args.join(" ")}" succeeded!`);
		return output;
	} catch (err: unknown) {
		const { example, message, silent = false } = error ?? {};

		// Silent mode: re-throw the raw error and let the caller handle it.
		if (silent) {
			logger.warn(`Command "${command} ${args.join(" ")}" failed silently.`);
			throw err;
		}

		logger.error(message ?? (err as Error));
		// Emitted on the error channel, not info — info is a no-op unless `watch` is on,
		// and the remediation hint has to reach the user on the default (silent) path.
		if (example) {
			logger.error(`Run: ${example}`);
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
 * @param command - The executable to run (e.g. `"git"`).
 * @param args - Arguments passed to the executable (e.g. `["config", "user.name"]`).
 * @param opts - Execution options. `stdio` and `encoding` are forwarded to `execFileSync`;
 * `error` controls failure behaviour. Defaults to `encoding: "utf-8"` and `stdio: "pipe"`.
 * @returns The trimmed stdout of the command, or an empty string when `stdio` is `"inherit"`.
 * @throws When the command fails and `opts.error.silent` is `true`.
 */
export function runCommandSync(command: string, args: string[], opts: CommandOptions): string {
	const { stdio = "pipe", encoding = "utf-8", watch = false, error } = opts;
	const logger = createLogger("run-command-sync", watch);

	try {
		logger.start(`Running command "${command} ${args.join(" ")}" ...`);
		// execFileSync returns null when stdio is "inherit" — output goes directly
		// to the terminal and is not captured. Return an empty string in that case.
		const output = execFileSync(command, args, { stdio, encoding });
		logger.success(`Command "${command} ${args.join(" ")}" succeeded!`);
		return (output ?? "").toString().trim();
	} catch (err: unknown) {
		const { message, example, silent = false } = error ?? {};

		// Silent mode: re-throw the raw error and let the caller handle it.
		if (silent) {
			logger.warn(`Command "${command} ${args.join(" ")}" failed silently.`);
			throw err;
		}

		logger.error(message ?? (err as Error));
		// Emitted on the error channel, not info — info is a no-op unless `watch` is on,
		// and the remediation hint has to reach the user on the default (silent) path.
		if (example) {
			logger.error(`Run: ${example}`);
		}
		process.exit(1);
	}
}
