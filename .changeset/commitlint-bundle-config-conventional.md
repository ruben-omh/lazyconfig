---
"@lazyconfig/commitlint": patch
---

Bundle `@commitlint/config-conventional` as a dependency. The preset's config extends it, but it was not declared, so installing `@lazyconfig/commitlint` on its own left the extends unresolved (`Cannot find module @commitlint/config-conventional`) unless the consumer installed it manually. It now ships with the preset, and consumers only add this package and the `@commitlint/cli` runner.
