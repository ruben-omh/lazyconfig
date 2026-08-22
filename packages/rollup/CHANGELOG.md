# @lazyconfig/rollup

## 0.1.1

### Patch Changes

- [`8aa77eb`](https://github.com/ruben-omh/lazyconfig/commit/8aa77eb1f25682f78816c3e678bfed2dba25da15) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Stop emitting bundles at the filesystem root when `outputDir` normalises to nothing.

  `outputDir` has its leading `./` or `/` and any trailing slashes stripped. For values consisting only of those characters — `"./"`, `"/"`, `""`, or whitespace — stripping consumed the entire string, and the output path was then built as `"" + "/" + file`, producing an absolute path like `/my-lib.mjs` that points at the filesystem root. The normalisation now falls back to `"."`, so those values resolve to the current directory as intended.

  Directories that survive normalisation are unaffected.

- [`0c9b671`](https://github.com/ruben-omh/lazyconfig/commit/0c9b671890fb07b47f3bd106f72d31bd0cab14cf) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Warn once per format when a UMD or IIFE bundle is missing its `name`.

  The check ran inside the per-output loop even though it depends only on the format and the bundle, so an array format config such as `umd: [devItem, prodItem]` printed the identical warning once per item. It now runs once per format.

  Also corrects documentation that referred to a `suffix` field on `FormatOutputOptions` — the field is `ext` — and states plainly that format-level `plugins` replace their shared counterpart per plugin rather than deep-merging, which is what the implementation has always done.

## 0.1.0

### Minor Changes

- [`4af3b37`](https://github.com/ruben-omh/lazyconfig/commit/4af3b37cb24bf9b28c471c33348171245d85bbed) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Initial public release of the @lazyconfig preset packages.
