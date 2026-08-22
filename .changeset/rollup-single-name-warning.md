---
"@lazyconfig/rollup": patch
---

Warn once per format when a UMD or IIFE bundle is missing its `name`.

The check ran inside the per-output loop even though it depends only on the format and the bundle, so an array format config such as `umd: [devItem, prodItem]` printed the identical warning once per item. It now runs once per format.

Also corrects documentation that referred to a `suffix` field on `FormatOutputOptions` — the field is `ext` — and states plainly that format-level `plugins` replace their shared counterpart per plugin rather than deep-merging, which is what the implementation has always done.
