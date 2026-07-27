# Changesets

This directory stores pending [changesets](https://github.com/changesets/changesets).
A changeset is a short markdown file that records which packages changed and
what kind of release each one needs. The CI pipeline turns accumulated
changesets into version bumps, changelog entries, and the eventual npm publish.

## When to add a changeset

Add a changeset whenever your PR changes the **source, public API, or runtime
behavior** of any package under `packages/*`. That includes:

- New exported APIs, options, or presets.
- Behavior changes a consumer can observe (rule sets, defaults, output shape).
- Bug fixes and performance improvements to published code.
- Breaking changes (renames, removals, signature changes, dropped peers).

You do **not** need a changeset for:

- Pure infrastructure work: root `package.json`, `pnpm-workspace.yaml`,
  `.github/`, `turbo.json`, lint/format/test config, scripts, CI workflows.
- Internal-only changes inside `scripts/` (it is private and ignored by
  changesets via `.changeset/config.json`).
- Documentation that is not shipped to npm (root `README.md`, `CLAUDE.md`,
  `CONTRIBUTING.md`).
- README updates inside `packages/*` if you also include them in another
  changeset — bundling is fine, separate is fine, do not invent a `patch`
  just to publish docs.

If in doubt, add a `patch` changeset. An extra patch costs nothing; a missing
changeset blocks the Version PR.

## How to add one

```sh
pnpm changeset
```

Pick the affected packages, the bump level, and write a one or two sentence
summary aimed at consumers reading the changelog. Commit the generated
`.changeset/<slug>.md` alongside your code changes.

## Choosing the bump level

The repo follows [semver](https://semver.org/) and the
[Conventional Commits](https://www.conventionalcommits.org/) mapping below:

| Bump      | When to use                                                                                                                   | Conventional commit                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **major** | Any breaking change: removed export, renamed option, dropped peer range, behavior change consumers must adapt to.             | `feat!:`, `fix!:`, `refactor!:` or `BREAKING CHANGE` |
| **minor** | Additive change: new preset, new option, new flag, new export — existing code keeps working as-is.                            | `feat:`                                              |
| **patch** | Bug fix, internal refactor visible in published code, performance, dependency bump that affects runtime, docs shipped to npm. | `fix:`, `perf:`, `refactor:`, `chore:`               |

### Quick rules

- Removing or renaming anything exported → **major**.
- Tightening a default that could break a consumer config → **major** (even if
  the diff is one line).
- Adding a new optional flag with a backwards-compatible default → **minor**.
- Adding a new file/preset/factory → **minor**.
- Adjusting an existing default in a way no reasonable consumer relied on → **patch**
  (call this out in the changeset summary).
- Editing types only, in a way TypeScript treats as a breaking change → **major**.

### Internal dependencies

`.changeset/config.json` sets `updateInternalDependencies: "patch"`. When you
bump package A, any workspace package that depends on A receives an automatic
patch bump. You do not need to add changesets for those downstream packages
yourself.

## Writing the summary

The summary becomes a line in `CHANGELOG.md` and is read by consumers.

Good:

> `defineConfig` now accepts a `node` option that enables `eslint-plugin-n`
> with sensible defaults. Set `node: true` to opt in.

Less good:

> add node support

Aim for: what changed, what a consumer should do about it, and any migration
note for `major` bumps. Link to the PR or issue if it adds useful context.

## Files in this directory

- `config.json` — changesets configuration. Do not edit casually; it controls
  the version, publish, and changelog behavior for the whole monorepo.
- `<slug>.md` — pending changesets, one per PR. Consumed and removed by the
  Version PR when versions are cut.
- This `README.md` — the guide you are reading.
