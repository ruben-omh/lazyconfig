# @lazyconfig/cli

## 0.2.0

### Minor Changes

- [`90c6f4f`](https://github.com/ruben-omh/lazyconfig/commit/90c6f4f6e594dbaa91921ad6adf425163ab4d599) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Resolve the declaration rollup through api-extractor's own config loader, and fail loudly when `--ext` cannot find one.

  `compile types --ext` located the `.d.ts` rollup by hand-parsing the api-extractor config: it read only `dtsRollup.untrimmedFilePath`, substituted `<projectFolder>` against the working directory, and — critically — did not follow `extends`. A config that inherits its rollup path from a shared base (the pattern `@lazyconfig/api-extractor/base.json` exists to support) resolved to nothing, and the command then returned quietly, emitting no `.d.mts` / `.d.cts` at all. With a dual-package `exports` map pointing at those files, the breakage only surfaced downstream after publish.

  Resolution is now delegated to api-extractor's `ExtractorConfig`, so `extends` chains, every `<token>`, `projectFolder`, and the trimmed rollup variants behave exactly as they did during the `api-extractor run` that produced the file. When a config genuinely emits no rollup, the command now reports it and exits 1 instead of skipping in silence.

  `@microsoft/api-extractor` is declared as an optional peer dependency. It is only needed by `compile types`, which already required its binary on `PATH`.

- [`379e6f6`](https://github.com/ruben-omh/lazyconfig/commit/379e6f65bc9066834447c0edf572c646177939ab) Thanks [@ruben-omh](https://github.com/ruben-omh)! - **Breaking:** `hook commit-signoff` no longer accepts a positional argument.

  The command was declared as `commit-signoff [options]`, which yargs read as a real optional positional named `options` rather than a usage placeholder. That made `lazyconfig hook commit-signoff "$1"` parse cleanly, exit 0, and sign `$GIT_DIR/COMMIT_EDITMSG` instead of the file git actually passed — the wrong file in a worktree, and silently so. `.strict()` could not catch it because the positional was declared.

  The placeholder is gone, so that form is now rejected with a clear error. Pass the message file with the flag instead:

  ```sh
  # .husky/prepare-commit-msg
  lazyconfig hook commit-signoff -f "$1"
  ```

### Patch Changes

- [`0c6f07b`](https://github.com/ruben-omh/lazyconfig/commit/0c6f07bab92e9258468af41dd9f969a912099b62) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Report the real error when a command fails asynchronously.

  The yargs `fail` handler read only its first argument. Yargs passes `(msg, err)`, and for a rejected async command handler it passes `msg === null` with the error in `err` — so every async failure printed `ERROR null` and exited 1 with nothing else. Since each package's build runs `lazyconfig compile types`, a broken build surfaced with no diagnostic at all.

  The handler now falls back to `err`, so the underlying message and stack reach the terminal. Validation failures are unaffected.

- [`3e51fd4`](https://github.com/ruben-omh/lazyconfig/commit/3e51fd4353f61faad288b71dcf8b4827102ed6c0) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Show the remediation command when a git invocation fails.

  Failures could carry an `example` — a copy-pasteable command that fixes the cause, such as `git config user.name "Your Name"` when the sign-off hook finds no configured author. Its value was never rendered. All it did was gate a different, generic line, and that line went through `logger.info`, which is a no-op unless `watch` is enabled — the opposite of the default that git hooks run under. The hint therefore never reached anyone.

  The example is now printed on the error channel alongside the message, so it appears on the default silent path where it is actually needed.

- [`a324a3f`](https://github.com/ruben-omh/lazyconfig/commit/a324a3fe363ed156fbaf94abcd626d3f284d5d58) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Fix `hook commit-signoff` silently dropping the sign-off under `git commit -v`.

  The trailer was appended to the end of the commit message file. Under `git commit -v` — and for anyone with `commit.verbose=true` configured — git places a scissors line and the diff below the message and discards everything from the scissors down, taking the appended trailer with it. The result was a commit with no `Signed-off-by` and no warning, which any DCO check then rejects.

  The trailer is now added with `git interpret-trailers --in-place`, which writes into the message's trailer block ahead of the comment and scissors sections. Repeat runs stay idempotent via `--if-exists addIfDifferent`, and a sign-off already present from a different author is preserved.

## 0.1.0

### Minor Changes

- [`4af3b37`](https://github.com/ruben-omh/lazyconfig/commit/4af3b37cb24bf9b28c471c33348171245d85bbed) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Initial public release of the @lazyconfig preset packages.
