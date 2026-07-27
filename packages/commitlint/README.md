# @lazyconfig/commitlint

[![npm](https://img.shields.io/npm/v/@lazyconfig/commitlint?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/commitlint)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/commitlint?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/commitlint)
[![Conventional Commits](https://img.shields.io/badge/conventional_commits-1.0.0-FE5196?style=flat-square&logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![License](https://img.shields.io/npm/l/@lazyconfig/commitlint?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Shared Commitlint configuration that enforces consistent, readable commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Extends `@commitlint/config-conventional` with an opinionated set of rules to keep commit history clean, predictable, and tooling-friendly across all projects.

---

## Features

- Based on Conventional Commits — compatible with changelogs, semantic versioning, and release tools
- Enforces 11 commit types covering the full development workflow
- Hard limits on header, scope, and subject length to keep history scannable
- Warnings for missing scope and blank lines before body/footer
- Fully overridable — extend or tighten any rule locally

---

## Installation

```bash
# pnpm
pnpm add -D @lazyconfig/commitlint @commitlint/cli @commitlint/config-conventional

# npm
npm install --save-dev @lazyconfig/commitlint @commitlint/cli @commitlint/config-conventional

# yarn
yarn add --dev @lazyconfig/commitlint @commitlint/cli @commitlint/config-conventional

# bun
bun add --dev @lazyconfig/commitlint @commitlint/cli @commitlint/config-conventional
```

---

## Usage

Create a `commitlint.config.cjs` in your project root:

```js
// commitlint.config.cjs
module.exports = {
	extends: ["@lazyconfig/commitlint"],
};
```

Or in ESM (`.commitlintrc.mjs`):

```js
export default {
	extends: ["@lazyconfig/commitlint"],
};
```

> Use `.cjs` for the CommonJS format — if your project has `"type": "module"` in `package.json`, a plain `.js` config file will be treated as ESM and `module.exports` will fail.

That's it — commitlint will now validate every commit message against lazyconfig's rules.

---

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Examples

```
feat(auth): add OAuth2 login support
fix(api): handle empty response in fetchUser
docs(readme): update installation instructions
chore(deps): upgrade typescript to v5.4
refactor(core): extract validation logic into helpers
test(utils): add edge-case coverage for parseDate
```

---

## Allowed Types

| Type       | Description                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | A new feature                                   |
| `fix`      | A bug fix                                       |
| `docs`     | Documentation changes only                      |
| `style`    | Formatting changes with no effect on logic      |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf`     | Performance improvements                        |
| `test`     | Adding or updating tests                        |
| `build`    | Build system or external dependency changes     |
| `ci`       | CI configuration changes                        |
| `chore`    | Maintenance and tooling tasks                   |
| `revert`   | Reverts a previous commit                       |

Commits using any other type will be **rejected with an error**.

---

## Enforced Rules

| Part    | Rule                             | Severity |
| ------- | -------------------------------- | -------- |
| Type    | Must not be empty                | Error    |
| Type    | Must be lowercase                | Error    |
| Type    | Must be one of the allowed types | Error    |
| Scope   | Must be lowercase                | Error    |
| Scope   | Must not be empty                | Warning  |
| Scope   | Maximum 25 characters            | Error    |
| Subject | Must not be empty                | Error    |
| Subject | Maximum 72 characters            | Error    |
| Header  | Maximum 100 characters           | Error    |
| Body    | Must be preceded by a blank line | Warning  |
| Footer  | Must be preceded by a blank line | Warning  |

> **Error** — commit is rejected. **Warning** — commit is accepted but a message is printed.

---

## Git Hooks Integration

Pair with [Husky](https://typicode.github.io/husky/) to validate commit messages automatically before they are recorded:

```bash
# pnpm
pnpm add -D husky
pnpm exec husky init

# npm
npm install --save-dev husky
npx husky init

# yarn
yarn add --dev husky
yarn husky init

# bun
bun add --dev husky
bunx husky init
```

Then add the `commit-msg` hook:

```sh
# .husky/commit-msg
commitlint --edit $1
```

> Husky v9 adds `node_modules/.bin` to `PATH` automatically, so `commitlint` can be called directly without a package manager prefix.

Once set up, any commit with a non-conforming message will be blocked immediately.

---

## Extending or Overriding Rules

Override any rule locally by adding a `rules` block:

```js
// commitlint.config.js
module.exports = {
	extends: ["@lazyconfig/commitlint"],
	rules: {
		// Make scope mandatory (error instead of warning)
		"scope-empty": [2, "never"],

		// Relax subject length if needed
		"subject-max-length": [2, "always", 100],
	},
};
```

---

## Related Links

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)

---

## License

MIT
