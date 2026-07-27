/**
 * Ambient type declarations for build-time constants injected by bundlers.
 * Include this file in your `tsconfig.json` to make these constants
 * available across your project without explicit imports.
 *
 * @example
 * ```json
 * {
 *   "compilerOptions": {
 *     "types": ["@lazyconfig/tsconfig/env"]
 *   }
 * }
 * ```
 */

/** Indicates whether the current build is running in development mode. */
declare const __DEV__: boolean;

/** Indicates whether the current build is running in production mode. */
declare const __PROD__: boolean;
