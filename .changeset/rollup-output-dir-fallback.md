---
"@lazyconfig/rollup": patch
---

Stop emitting bundles at the filesystem root when `outputDir` normalises to nothing.

`outputDir` has its leading `./` or `/` and any trailing slashes stripped. For values consisting only of those characters — `"./"`, `"/"`, `""`, or whitespace — stripping consumed the entire string, and the output path was then built as `"" + "/" + file`, producing an absolute path like `/my-lib.mjs` that points at the filesystem root. The normalisation now falls back to `"."`, so those values resolve to the current directory as intended.

Directories that survive normalisation are unaffected.
