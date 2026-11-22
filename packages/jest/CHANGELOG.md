# @lazyconfig/jest

## 0.2.1

### Patch Changes

- [`264718a`](https://github.com/ruben-omh/lazyconfig/commit/264718a7f4095e44a0e8eaeaa1e8474fad0774f1) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Fix type resolution for CommonJS consumers. Removed the top-level `types` entry in the package `exports` that shadowed the per-condition `.d.mts`/`.d.cts` declarations, which caused `@arethetypeswrong/cli` to report the CJS build as masquerading as ESM. `require` consumers now resolve the correct `.d.cts` types.

## 0.2.0

### Minor Changes

- [`91fa1ef`](https://github.com/ruben-omh/lazyconfig/commit/91fa1efc1785d1aa7f6a8272fb593b3954044ee3) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Narrow the coverage exclusion for type-only modules from `!src/**/types.*` to `!src/**/*.d.ts`.

  The old pattern matched on filename alone, so any module named `types.ts` was dropped from coverage regardless of what it contained. A build script carrying real logic and its own test suite was excluded on that basis, and the package still reported 100% — the number was measuring a smaller set of files than it appeared to.

  **This changes the coverage numbers a project reports.** Modules named `types.ts` or `types.tsx` that hold executable code are now measured, which can move a percentage in either direction and can fail a build that sets `coverageThreshold`. Files that really are type-only should be excluded per package:

  ```js
  defineConfig({
  	coverage: true,
  	extends: {
  		coveragePathIgnorePatterns: ["src/types\\.ts$"],
  	},
  });
  ```

## 0.1.0

### Minor Changes

- [`4af3b37`](https://github.com/ruben-omh/lazyconfig/commit/4af3b37cb24bf9b28c471c33348171245d85bbed) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Initial public release of the @lazyconfig preset packages.
