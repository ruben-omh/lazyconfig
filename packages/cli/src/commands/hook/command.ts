import type { YargsCommandModule } from "../../types";
import { commitSignoffCommand } from "./sub-commands/index";

/**
 * Top-level `hook` command namespace.
 *
 * Groups automation scripts designed to be invoked from git hooks (e.g. via Husky).
 * Each subcommand targets a specific hook type and exits with code 1 on failure so
 * git aborts the operation.
 *
 * @example
 * ```sh
 * # .husky/prepare-commit-msg
 * lazyconfig hook commit-signoff "$1"
 * ```
 */
const command: YargsCommandModule = {
	command: "hook <command>",
	describe: "Automation scripts for use in git hooks",

	builder: (yargs) =>
		yargs.usage("$0 hook <command> [options]").command(commitSignoffCommand).strict(),

	handler: () => {},
};

export default command;
