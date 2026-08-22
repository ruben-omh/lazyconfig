import { join } from "node:path";
import { runCommandSync } from "../../../../helpers/run-command";
import type { CommitSignoffOptions } from "../../../../types";
import { createLogger } from "../../../../helpers/log";

/**
 * Adds a `Signed-off-by` trailer to the commit message if not already present.
 *
 * Reads the commit author's name and email from the local git config and hands the
 * resulting `Signed-off-by: Name <email>` trailer to `git interpret-trailers`, which
 * places it in the message's trailer block — correctly under `git commit -v`, where
 * anything appended past the scissors line would be discarded. Repeat runs are
 * idempotent. Exits with code 1 if `user.name` or `user.email` is not configured.
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
 *
 * # Default: resolves the message file from $GIT_DIR/COMMIT_EDITMSG
 * lazyconfig hook commit-signoff
 *
 * # Explicit path — always prefer this, git passes the correct file as $1
 * lazyconfig hook commit-signoff -f "$1"
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

	logger.start(`Adding trailer "${trailer}" to commit message.`);
	// Delegated to git rather than appending to the end of the file. Under `git commit -v`
	// (and `commit.verbose=true`) the message is followed by a scissors line and the diff,
	// and git discards everything from the scissors down — an appended trailer goes with it,
	// producing a commit with no sign-off and no warning. `interpret-trailers` inserts into
	// the message's trailer block instead, ahead of the comment and scissors sections, and
	// also handles the blank-line separation commitlint's body-leading-blank rule requires.
	// `--if-exists addIfDifferent` keeps repeat runs (e.g. `--amend`) idempotent.
	runCommandSync(
		"git",
		[
			"interpret-trailers",
			"--in-place",
			"--if-exists",
			"addIfDifferent",
			"--trailer",
			trailer,
			msgFile,
		],
		{
			watch,
			error: { message: `Could not add the Signed-off-by trailer to "${msgFile}".` },
		},
	);
	logger.success(`Trailer successfully added!`);
}
