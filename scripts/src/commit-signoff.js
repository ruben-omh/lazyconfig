#!/usr/bin/env node
"use strict";

const { join } = require("node:path");
const { readFileSync, writeFileSync } = require("node:fs");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const createLogger = require("./utils/logger");
const { runCommandSync } = require("./utils/run-command");

/**
 * Appends a `Signed-off-by` trailer to the commit message if not already present.
 *
 * Reads the commit author's name and email from the local git config and constructs
 * a `Signed-off-by: Name <email>` footer. Exits early without modifying the file if
 * the trailer is already present. Exits with code 1 if `user.name` or `user.email`
 * is not configured.
 *
 * @param {{ msgFile?: string, mock?: boolean }} [opts]
 * @param {string} [opts.msgFile] - Path to the commit message file. Git passes this as `$1`
 *   in the `prepare-commit-msg` hook. Defaults to `$GIT_DIR/COMMIT_EDITMSG`. In git worktrees
 *   the path differs (e.g. `.git/worktrees/<name>/COMMIT_EDITMSG`), so always prefer forwarding
 *   the value git provides rather than relying on the default.
 * @param {boolean} [opts.mock] - When `true`, logs each step without executing any commands
 *   or writing files.
 */
function commitSignoff(opts = {}) {
	const { msgFile = join(process.env.GIT_DIR ?? ".git", "COMMIT_EDITMSG"), mock = false } = opts;

	const log = createLogger("commit-signoff");

	if (mock) {
		log.box("Running in mock mode — no commands will be executed.");
	}

	log.info(`Signing commit message in ${msgFile}.`);

	const name = mock
		? "Mock User"
		: runCommandSync("git", ["config", "user.name"], {
				error: {
					message: "git config user.name is not configured.",
					example: 'git config user.name "Your Name"',
				},
			});

	const email = mock
		? "mock@example.com"
		: runCommandSync("git", ["config", "user.email"], {
				error: {
					message: "git config user.email is not configured.",
					example: 'git config user.email "you@example.com"',
				},
			});

	const trailer = `Signed-off-by: ${name} <${email}>`;

	if (mock) {
		log.warn(`[mock] Would read commit message from ${msgFile}`);
		log.warn(`[mock] Would append trailer "${trailer}"`);
		log.success("Mock run complete — no files were written.");
		return;
	}

	const content = readFileSync(msgFile, "utf-8");

	if (content.includes(trailer)) {
		log.info("Trailer already present — skipping.");
		return;
	}

	log.start(`Adding trailer "${trailer}" to commit message.`);
	// Blank line before the trailer is required by the commitlint body-leading-blank rule.
	writeFileSync(msgFile, `${content.trimEnd()}\n\n${trailer}\n`);
	log.success("Trailer successfully added!");
}

void yargs()
	.command({
		command: "$0",
		describe: "Append a Signed-off-by trailer to the commit message",

		builder: (y) =>
			y
				.option("msgFile", {
					type: "string",
					alias: "f",
					describe:
						"Path to the commit message file (git's $1). Defaults to $GIT_DIR/COMMIT_EDITMSG.",
				})
				.option("mock", {
					type: "boolean",
					alias: "m",
					describe: "Log each step without executing any commands or writing files.",
					default: false,
				}),

		handler: (argv) => {
			commitSignoff({ msgFile: argv.msgFile, mock: argv.mock });
		},
	})
	.strict()
	.fail((msg) => {
		const log = createLogger("yargs-fail");
		log.error(msg);
		process.exit(1);
	})
	.parse(hideBin(process.argv));
