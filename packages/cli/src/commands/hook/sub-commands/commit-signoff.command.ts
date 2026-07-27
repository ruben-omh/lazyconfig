import type { CommitSignoffOptions, YargsCommandModule } from "../../../types";

/**
 * Yargs sub-command definition for `lazyconfig hook commit-signoff`.
 * The script is lazy-loaded on invocation to keep startup time low.
 */
const command: YargsCommandModule<object, CommitSignoffOptions> = {
	command: "commit-signoff [options]",
	describe: "Append a Signed-off-by trailer to the commit message",

	builder: (yargs) =>
		yargs
			.option("msgFile", {
				type: "string",
				alias: "f",
				describe:
					"Path to the commit message file (git's $1). Defaults to $GIT_DIR/COMMIT_EDITMSG.",
			})
			.option("watch", {
				type: "boolean",
				alias: "w",
				describe: "Emit log messages during execution. Defaults to false.",
			})
			.example("$0 hook commit-signoff -f $1", "Append Signed-off-by in .husky/prepare-commit-msg"),

	handler: async (argv) => {
		const { commitSignoff } = await import("./scripts/commit-signoff");
		commitSignoff({ ...argv });
	},
};

export default command;
