---
"@lazyconfig/presets": minor
---

Add CommonJS support to the `rollup`, `jest`, and `eslint` preset subpaths. They now ship dual ESM/CJS builds, so `@lazyconfig/presets/{rollup,jest,eslint}` resolve under both `import` and `require` (previously ESM-only, which broke CommonJS config files).
