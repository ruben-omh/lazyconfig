---
"@lazyconfig/eslint": patch
---

Derive `defineConfig({ ignores: [...] })` from the `ignores` preset instead of rebuilding the entry.

Passing extra patterns previously constructed a fresh `{ ignores: [...DEFAULT_IGNORE_PATTERNS, ...extra] }` object, so any field later added to the `ignores` preset would have applied on the `ignores: true` path only. Both paths now map over the preset. Output is unchanged.

The exported `ignores` const is typed `(Linter.Config & { ignores: string[] })[]` rather than `Linter.Config[]`, which lets the merge drop a defensive fallback. This narrows the type, so it stays assignable wherever `Linter.Config[]` was expected.
