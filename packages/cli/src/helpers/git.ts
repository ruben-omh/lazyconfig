import type { DefaultScriptOptions } from "../types";
import { createLogger } from "./log";
import { runCommandSync } from "./run-command";

/**
 * Returns the name of the current git branch.
 *
 * Returns `"HEAD"` in any state where a branch name cannot be determined:
 * - Detached HEAD (e.g. after checking out a tag or commit hash directly)
 * - Unborn branch (fresh `git init` with no commits yet)
 * - Outside a git repository
 *
 * Callers should check for `"HEAD"` and skip branch-specific logic in that case.
 *
 * @param opts - Execution options.
 * @param opts.watch - When `true`, emits log messages for each step executed.
 * @returns The current branch name, or `"HEAD"` when a branch name cannot be determined.
 *
 * @example
 * ```ts
 * const branch = getCurrentBranch();
 *
 * if (branch === "HEAD") {
 *   // detached HEAD or unborn branch — skip branch-specific logic
 *   return;
 * }
 * ```
 */
export function getCurrentBranch(opts: DefaultScriptOptions = {}): string {
	const { watch = false } = opts;
	const logger = createLogger("get-current-branch", watch);
	try {
		logger.info(`Getting current branch.`);
		return runCommandSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
			watch,
			error: { silent: true },
		});
	} catch {
		logger.info(`Branch name cannot be determined.`);
		// Unborn branch (no commits yet) or not inside a git repository.
		// Return "HEAD" so callers apply their existing detached HEAD guard.
		return "HEAD";
	}
}

/**
 * Returns the exact tag pointing to HEAD, or `undefined` if HEAD is not exactly tagged.
 *
 * Unlike `git describe`, this only returns a value when HEAD is the tagged commit itself —
 * not when it is a number of commits ahead of a tag.
 *
 * @param opts - Execution options.
 * @param opts.watch - When `true`, emits log messages for each step executed.
 * @returns The exact tag name (e.g. `"v1.0.0"`), or `undefined` if HEAD is not exactly tagged.
 *
 * @example
 * ```ts
 * const tag = getExactTag();
 *
 * if (tag) {
 *   console.log(`Publishing release ${tag}`);
 * }
 * ```
 */
export function getExactTag(opts: DefaultScriptOptions = {}): string | undefined {
	const { watch = false } = opts;
	const logger = createLogger("get-exact-tag", watch);
	try {
		logger.info(`Getting exact tag.`);
		return runCommandSync("git", ["describe", "--exact-match", "--tags", "HEAD"], {
			watch,
			error: { silent: true },
		});
	} catch {
		logger.info(`Tag name cannot be determined.`);
		return undefined;
	}
}

/**
 * Returns `true` if the remote tracking branch has commits the local branch hasn't pulled yet.
 *
 * Returns `false` if the branch is up to date, has no upstream configured, or the check fails
 * for any reason (e.g. detached HEAD, unborn branch, no network access). Safe to call unconditionally.
 *
 * @param opts - Execution options.
 * @param opts.watch - When `true`, emits log messages for each step executed.
 * @returns `true` if the local branch is behind its remote, `false` otherwise.
 *
 * @example
 * ```ts
 * // In post-checkout: skip install if there are pending upstream commits —
 * // post-merge will handle it after the user pulls.
 * if (isBehindRemote()) {
 *   return;
 * }
 * ```
 */
export function isBehindRemote(opts: DefaultScriptOptions = {}): boolean {
	const { watch = false } = opts;
	const logger = createLogger("is-behind-remote", watch);
	try {
		logger.info(`Checking if the local branch is behind the remote.`);
		const count = runCommandSync("git", ["rev-list", "--count", "HEAD..@{u}"], {
			watch,
			error: { silent: true },
		});
		return Number.parseInt(count, 10) > 0;
	} catch {
		logger.info(`Could not determine remote status — skipping.`);
		return false;
	}
}
