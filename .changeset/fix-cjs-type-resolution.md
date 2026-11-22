---
"@lazyconfig/eslint": patch
"@lazyconfig/jest": patch
"@lazyconfig/rollup": patch
---

Fix type resolution for CommonJS consumers. Removed the top-level `types` entry in the package `exports` that shadowed the per-condition `.d.mts`/`.d.cts` declarations, which caused `@arethetypeswrong/cli` to report the CJS build as masquerading as ESM. `require` consumers now resolve the correct `.d.cts` types.
