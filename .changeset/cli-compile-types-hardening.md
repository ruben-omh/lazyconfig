---
"@lazyconfig/cli": patch
---

Harden `lazyconfig compile types`: emit `.d.<ext>` declaration copies from every configured api-extractor rollup (untrimmed and trimmed) instead of only the first, validate the `--ext` values, and fail with a clear error message instead of a silent exit when a declaration rollup cannot be resolved.
