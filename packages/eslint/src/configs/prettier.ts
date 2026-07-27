import type { Linter } from "eslint";
import { requirePeer } from "../helpers/require-peer";

/**
 * Disables all ESLint formatting rules that would conflict with Prettier.
 * Works with any Prettier configuration — no dependency on `@lazyconfig/prettier`.
 *
 * Always add this preset last so it can override any formatting rules
 * introduced by other presets.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { base, typescript, react, prettier } from '@lazyconfig/eslint';
 *
 * export default [...base, ...typescript(), ...react(), ...prettier()];
 * ```
 *
 * @throws When `eslint-config-prettier` is not installed.
 */
export function prettier(): Linter.Config[] {
	const prettierConfig = requirePeer<Linter.Config>("eslint-config-prettier", "prettier");
	return [prettierConfig];
}
