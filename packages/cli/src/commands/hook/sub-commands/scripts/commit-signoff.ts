import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { runCommandSync } from "../../../../helpers/run-command";
import type { CommitSignoffOptions } from "../../../../types";
import { createLogger } from "../../../../helpers/log";

/**
 * Appends a `Signed-off-by` trailer to the commit message if not already present.
 *
 * Reads the commit author's name and email from the local git config and constructs
 * a `Signed-off-by: Name <email>` footer. Exits early without modifying the file if
 * the trailer is already present. Exits with code 1 if `user.name` or `user.email`
 * is not configured.
 *
 * @param opts - Execution options.
 * @param opts.msgFile - Path to the commit message file. Git passes this as `$1` in the
 * `prepare-commit-msg` hook. Defaults to `$GIT_DIR/COMMIT_EDITMSG`. In git worktrees the
 * path differs (e.g. `.git/worktrees/<name>/COMMIT_EDITMSG`), so always prefer forwarding
 * the value git provides rather than relying on the default.
 * @param opts.watch - When `true`, emits a log message after writing the trailer and when
 * skipping because the trailer is already present.
 *
 * @example
 * ```sh
 * # .husky/prepare-commit-msg
 * lazyconfig hook commit-signoff -f "$1"
 * ```
 *
 * @example
 * ```ts
 * import { commitSignoff } from "@lazyconfig/cli";
 *
 * // Default: resolves the message file from $GIT_DIR/COMMIT_EDITMSG
 * commitSignoff();
 *
 * // Explicit path (e.g. inside a git worktree)
 * commitSignoff({ msgFile: ".git/worktrees/my-worktree/COMMIT_EDITMSG" });
 * ```
 */
export function commitSignoff(opts: CommitSignoffOptions = {}): void {
	const { watch = false, msgFile = join(process.env.GIT_DIR ?? ".git", "COMMIT_EDITMSG") } = opts;
	const logger = createLogger("commit-signoff", watch);
	logger.info(`Signing commit message in ${msgFile}.`);
	const name = runCommandSync("git", ["config", "user.name"], {
		watch,
		error: {
			message: "git config user.name is not configured.",
			example: 'git config user.name "Your Name"',
		},
	});
	const email = runCommandSync("git", ["config", "user.email"], {
		watch,
		error: {
			message: "git config user.email is not configured.",
			example: 'git config user.email "you@example.com"',
		},
	});

	const trailer = `Signed-off-by: ${name} <${email}>`;
	const content = readFileSync(msgFile, "utf-8");

	if (content.includes(trailer)) {
		logger.info(`Trailer already present — skipping.`);
		return;
	}

	logger.start(`Adding trailer "${trailer}" to commit message.`);
	// Blank line before the trailer is required by the commitlint body-leading-blank rule.
	writeFileSync(msgFile, `${content.trimEnd()}\n\n${trailer}\n`);
	logger.success(`Trailer successfully added!`);
}
