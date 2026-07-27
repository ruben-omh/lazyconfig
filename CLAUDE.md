# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Monorepo of shareable, composable configuration packages for JS/TS projects. Each `@lazyconfig/*` package is a thin, opinionated preset that consumers extend via `defineConfig({...})` or `extends: "..."`. The meta-package `@lazyconfig/presets` re-exports every other preset for single-install setups.

Published packages live under `packages/`; `scripts/` is a private internal package used only by the monorepo itself.

| Package                     | Role                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@lazyconfig/eslint`        | Flat ESLint presets — `base` always on, opt-in flags for ts/react/a11y/node/prettier/ignores                  |
| `@lazyconfig/jest`          | Jest presets via SWC + jsdom; coverage, JUnit, path aliases                                                   |
| `@lazyconfig/rollup`        | Declarative rollup config: `bundles[]`, `formats`, opt-in `plugins`                                           |
| `@lazyconfig/tsconfig`      | tsconfig presets (`base`/`node`/`lib`/`react`) + `env.d.ts` for `__DEV__`/`__PROD__`                          |
| `@lazyconfig/prettier`      | Prettier preset                                                                                               |
| `@lazyconfig/commitlint`    | Conventional Commits enforcement (11 types)                                                                   |
| `@lazyconfig/api-extractor` | Base `api-extractor.json`                                                                                     |
| `@lazyconfig/cli`           | `lazyconfig` binary — `compile types` (tsc + api-extractor) and `hook commit-signoff`                         |
| `@lazyconfig/presets`       | Meta-package; re-exports everything via subpath `exports`                                                     |
| `scripts/` (private)        | `@lazyconfig/scripts` — internal `build-types` and `commit-signoff` Node scripts (consumed via `workspace:*`) |

## Commands

Turbo orchestrates the build/test/typecheck graph; root scripts delegate to it.

```sh
pnpm build                    # turbo build  (respects ^build dependency graph)
pnpm test                     # turbo test
pnpm typecheck                # turbo typecheck
pnpm lint                     # eslint .
pnpm dev                      # turbo dev (watch, persistent)
pnpm clean                    # turbo clean && rimraf .turbo
pnpm clean:reset              # full wipe: node_modules + lockfile
```

Single-package operations:

```sh
pnpm --filter @lazyconfig/eslint build
pnpm --filter @lazyconfig/eslint test
pnpm --filter @lazyconfig/eslint test -- path/to/file.test.ts          # single test file
pnpm --filter @lazyconfig/eslint test -- -t "test name"                # single test by name
```

Per-package `build` script chains `lazyconfig compile types` (own CLI, dogfooded) → `rollup --config`. The `--ext mts cts` flag emits `.d.mts`/`.d.cts` alongside `.d.ts` to satisfy the dual-package `exports` map.

`@lazyconfig/presets` is special: its build is just `node scripts/copy-configs.mjs` — it copies/regenerates the re-export shims from sibling packages. No rollup involved.

## Architecture conventions

- **Every preset exposes `defineConfig(options)`** returning the framework's native config type (`Linter.Config[]`, `jest.Config`, `RollupOptions[]`). Consumers compose by passing flags, not by editing.
- **`base` is always included** in `@lazyconfig/eslint`. All other presets (`typescript`, `react`, `a11y`, `node`, `prettier`, `ignores`) are opt-in boolean flags.
- **Peer-dependent presets are factory functions** (`() => Linter.Config[]`) so missing peers fail at the call site with an actionable error, never silently as a no-op.
- **Missing peer deps go through `requirePeer<T>(specifier)`** (see `packages/rollup/src/helpers/require-peer.ts`) — duck-typed `MODULE_NOT_FOUND` detection, cross-realm-safe for Jest. The error reads `[@lazyconfig/<pkg>]: plugin "<specifier>" is enabled but not installed. Run: pnpm add -D <specifier>`. Reuse this helper rather than reimplementing import-with-fallback.
- **Public surfaces are curated in `src/index.ts`** of each package — never `export *`.

## Dependency management

Single source of truth is `pnpm-workspace.yaml`'s `catalog:` block. Every third-party version is pinned there; every `package.json` references it as `"<pkg>": "catalog:"`. To bump a dep, edit the catalog once.

Internal workspace deps use `workspace:*`; `saveWorkspaceProtocol: rolling` rewrites them to `workspace:^` and pnpm rewrites again to concrete versions on publish.

Other relevant `pnpm-workspace.yaml` settings:

- `saveExact: true` — `pnpm add` writes exact versions.
- `engineStrict: true` — `engines` is enforced at install.
- `minimumReleaseAgeStrict: true` — supply-chain defense; fresh registry publishes are refused unless explicitly allowlisted. Don't weaken casually.
- `peerDependencyRules.allowedVersions` — used to whitelist `eslint@10` for plugins (`jsx-a11y`, `react`, `react-hooks`) whose peer ranges haven't caught up yet.
- `allowedDeprecatedVersions` + `overrides` — silence the transitive `glob@7` / `inflight` warning that comes via `jest` → `babel-plugin-istanbul`.

## Commits, hooks, and the release pipeline

### Commits

- **Conventional Commits, enforced by commitlint** (`.commitlintrc.json`). Allowed scopes are pinned: `api-extractor`, `contributing`, `changeset`, `cli`, `ci`, `commitlint`, `deps`, `eslint`, `github`, `jest`, `presets`, `prettier`, `release`, `root`, `rollup`, `scripts`, `tsconfig`. Unknown scopes are rejected.
- **Every commit must be GPG-signed AND DCO-signed-off** — both enforced by CI. Configure once with `commit.gpgsign=true` + `format.signOff=true` so plain `git commit` produces compliant commits. To re-sign a branch: `git rebase --exec 'git commit --amend --no-edit -S -s' main`.
- Husky runs commitlint on `commit-msg` and lint-staged on `pre-commit` (eslint --fix + prettier on TS/JS, prettier on JSON/MD).

### Releases (Changesets + manual dispatch)

Six workflows form one pipeline; you only touch two of them (PR and release).

1. **`ci.yml`** validates every PR (commitlint, DCO, GPG, test-suite). Branch-protection requires it green.
2. **`test-suite.yml`** (reusable, `workflow_call`) — build + lint + test matrix on Node 22 and 24.
3. **`version.yml`** — on push to `main`, opens/refreshes the Version PR when changesets are pending.
4. **`release.yml`** — manual `workflow_dispatch` only. Publishes to npm via OIDC. Merging the Version PR does NOT publish; a maintainer must dispatch this from Actions UI after the Version PR is merged. Verifies "something to publish" before touching npm (`npm view` per package) so dispatching too early fails loudly instead of silently no-op-ing. On success, auto-closes any open "Release pending" tracking issue.
5. **`release-reminder.yml`** — when a Version PR (head branch `changeset-release/*`) is merged into `main`, opens (or comments on) a "Release pending" tracking issue so the manual `release.yml` dispatch is not forgotten. `release.yml` closes the issue on successful publish.
6. **`bootstrap-package.yml`** — one-time per new package. npm Trusted Publishers (OIDC) requires the package name to already exist on the registry before OIDC can be configured, so the first publish for a brand-new package uses this workflow with `NPM_TOKEN`. After that, the package joins the normal Changesets flow.

Add a `.changeset/*.md` for any source/public-API change in a `packages/*` package. Bump levels: breaking → `major`, additive → `minor`, fix/perf/internal → `patch`. `.changeset/config.json` declares `updateInternalDependencies: "patch"`, so workspace packages depending on a bumped package get an automatic patch.

### GitHub Actions pinning

Any PR touching `.github/workflows/` or `.github/actions/` must pin every third-party action to a full commit SHA (mutable tags like `@v4` are rejected). Use `npx pin-github-action@3.4.0 --recursive .github/workflows/`. Exceptions: in-repo composite actions (`./.github/actions/...`) and reusable workflows (`./.github/workflows/...`).

## Testing

Each preset package has a `test/define-config.test.ts` that exercises the `defineConfig` factory. Tests verify the **shape of the returned config** (which rules are present, which plugins are wired, which output formats are emitted) — they do not invoke ESLint, Jest, or Rollup themselves. This keeps the suite fast and decouples it from upstream rule changes.

House style:

- Top-of-file helpers, separated by `// --- helpers ---` / `// --- tests ---` banners.
- Helpers favour structural finders (`findByRule`, `findByPlugin`, `findIgnoresEntry`) and factory functions (`base()` for required-field configs) over deep snapshot diffs — snapshots rot on every framework version bump.
- Group by feature flag with nested `describe`s (`defaults`, `formats`, `typescript`, `react`, …) so each opt-in's contract is readable in isolation.
- Stub optional peers via `test/__mocks__/<peer>.js` + `moduleNameMapper` in the package's `jest.config.js` (see `packages/eslint`). Real peer modules are not installed in tests — `requirePeer`'s positive path is exercised through these stubs.
- Subdirectories like `test/resolvers/` and `test/helpers/` mirror the corresponding `src/` layout for non-`defineConfig` units (e.g. `require-peer`, rollup output/plugin resolvers).

Run a single preset's suite with `pnpm --filter @lazyconfig/<pkg> test`. Coverage is enabled by default via `@lazyconfig/jest`'s preset.

## Dogfooding caveat

This repo consumes its own packages:

- Root `eslint.config.js` extends `@lazyconfig/eslint`.
- Per-package `jest.config.js` extends `@lazyconfig/jest`.
- `.commitlintrc.json` extends `@lazyconfig/commitlint`.
- Per-package `build` script invokes the `lazyconfig` CLI from `@lazyconfig/cli`.

A breaking change to a preset can therefore break this monorepo's own build before any consumer notices. Run `pnpm build && pnpm test && pnpm lint` end-to-end after any non-trivial preset change.
