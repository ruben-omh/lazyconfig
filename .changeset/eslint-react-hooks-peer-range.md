---
"@lazyconfig/eslint": patch
---

Widen the `eslint-plugin-react-hooks` peer range to `^5 || ^7`.

The declared range was `^5`, while the preset is developed and tested against 7.x — the current release. Because pnpm enables `strict-peer-dependencies` by default, any consumer on a current react-hooks plugin hit a hard install failure, and `peerDependenciesMeta.optional` does not help: optional governs presence, not version.

Version 6 is deliberately excluded. It ships `configs.recommended` as a flat-config array rather than an object, so the `configs.recommended.rules` the `react` preset spreads is `undefined` there — which would silently apply no react-hooks rules at all. Versions 5 and 7 both expose the object form.
