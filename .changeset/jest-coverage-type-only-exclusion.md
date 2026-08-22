---
"@lazyconfig/jest": minor
---

Narrow the coverage exclusion for type-only modules from `!src/**/types.*` to `!src/**/*.d.ts`.

The old pattern matched on filename alone, so any module named `types.ts` was dropped from coverage regardless of what it contained. A build script carrying real logic and its own test suite was excluded on that basis, and the package still reported 100% — the number was measuring a smaller set of files than it appeared to.

**This changes the coverage numbers a project reports.** Modules named `types.ts` or `types.tsx` that hold executable code are now measured, which can move a percentage in either direction and can fail a build that sets `coverageThreshold`. Files that really are type-only should be excluded per package:

```js
defineConfig({
	coverage: true,
	extends: {
		coveragePathIgnorePatterns: ["src/types\\.ts$"],
	},
});
```
