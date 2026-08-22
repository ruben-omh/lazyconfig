---
"@lazyconfig/cli": minor
---

Resolve the declaration rollup through api-extractor's own config loader, and fail loudly when `--ext` cannot find one.

`compile types --ext` located the `.d.ts` rollup by hand-parsing the api-extractor config: it read only `dtsRollup.untrimmedFilePath`, substituted `<projectFolder>` against the working directory, and — critically — did not follow `extends`. A config that inherits its rollup path from a shared base (the pattern `@lazyconfig/api-extractor/base.json` exists to support) resolved to nothing, and the command then returned quietly, emitting no `.d.mts` / `.d.cts` at all. With a dual-package `exports` map pointing at those files, the breakage only surfaced downstream after publish.

Resolution is now delegated to api-extractor's `ExtractorConfig`, so `extends` chains, every `<token>`, `projectFolder`, and the trimmed rollup variants behave exactly as they did during the `api-extractor run` that produced the file. When a config genuinely emits no rollup, the command now reports it and exits 1 instead of skipping in silence.

`@microsoft/api-extractor` is declared as an optional peer dependency. It is only needed by `compile types`, which already required its binary on `PATH`.
