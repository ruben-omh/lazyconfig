# @lazyconfig/eslint

## 0.1.1

### Patch Changes

- [`a7ec1dc`](https://github.com/ruben-omh/lazyconfig/commit/a7ec1dcc479bff5bc5b528ee89fba25db589f39e) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Derive `defineConfig({ ignores: [...] })` from the `ignores` preset instead of rebuilding the entry.

  Passing extra patterns previously constructed a fresh `{ ignores: [...DEFAULT_IGNORE_PATTERNS, ...extra] }` object, so any field later added to the `ignores` preset would have applied on the `ignores: true` path only. Both paths now map over the preset. Output is unchanged.

  The exported `ignores` const is typed `(Linter.Config & { ignores: string[] })[]` rather than `Linter.Config[]`, which lets the merge drop a defensive fallback. This narrows the type, so it stays assignable wherever `Linter.Config[]` was expected.

- [`9ea8ce1`](https://github.com/ruben-omh/lazyconfig/commit/9ea8ce13089f4bb451a22dd4cc7125d87c6fa292) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Widen the `eslint-plugin-react-hooks` peer range to `^5 || ^7`.

  The declared range was `^5`, while the preset is developed and tested against 7.x — the current release. Because pnpm enables `strict-peer-dependencies` by default, any consumer on a current react-hooks plugin hit a hard install failure, and `peerDependenciesMeta.optional` does not help: optional governs presence, not version.

  Version 6 is deliberately excluded. It ships `configs.recommended` as a flat-config array rather than an object, so the `configs.recommended.rules` the `react` preset spreads is `undefined` there — which would silently apply no react-hooks rules at all. Versions 5 and 7 both expose the object form.

## 0.1.0

### Minor Changes

- [`4af3b37`](https://github.com/ruben-omh/lazyconfig/commit/4af3b37cb24bf9b28c471c33348171245d85bbed) Thanks [@ruben-omh](https://github.com/ruben-omh)! - Initial public release of the @lazyconfig preset packages.
