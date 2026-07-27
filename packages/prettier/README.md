# @lazyconfig/prettier

[![npm](https://img.shields.io/npm/v/@lazyconfig/prettier?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/prettier)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/prettier?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/prettier)
[![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black)](https://prettier.io/)
[![License](https://img.shields.io/npm/l/@lazyconfig/prettier?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Shared, opinionated Prettier configuration for consistent code formatting across projects.

Provides a single `base.json` preset that keeps code style predictable and diff-noise low. Every option is chosen deliberately — the goal is a format that is easy to read, easy to review, and consistent across JavaScript, TypeScript, JSX, JSON, and Markdown files.

---

## Features

- Tabs for indentation — visually consistent regardless of editor tab-size preference
- Single quotes throughout JS/TS and JSX
- 100-character print width — readable on wide monitors without excessive wrapping
- Trailing commas everywhere valid in ES2017+ — cleaner multi-line diffs
- Unix line endings — consistent across macOS, Linux, and Windows
- Strict HTML whitespace sensitivity — avoids silent whitespace bugs in templates
- Auto-formats embedded languages (CSS-in-JS, GraphQL, SQL, etc.)

---

## Installation

```bash
# pnpm
pnpm add -D prettier @lazyconfig/prettier

# npm
npm install -D prettier @lazyconfig/prettier

# yarn
yarn add --dev prettier @lazyconfig/prettier

# bun
bun add --dev prettier @lazyconfig/prettier
```

---

## Usage

Reference the shared config from your Prettier configuration file. Choose the format that fits your project:

### `.prettierrc.json`

```json
"@lazyconfig/prettier"
```

### `.prettierrc.mjs` — extend or override

```js
import base from "@lazyconfig/prettier" with { type: "json" };

/** @type {import("prettier").Config} */
export default {
	...base,
	// add project-specific overrides here
	semi: false,
};
```

### `.prettierrc.js` (CommonJS)

```js
const base = require("@lazyconfig/prettier");

/** @type {import("prettier").Config} */
module.exports = {
	...base,
	// add project-specific overrides here
};
```

---

## Configuration Reference

Full list of options and the reasoning behind each choice:

| Option                       | Value         | Why                                                                                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useTabs`                    | `true`        | Prettier writes `\t` characters for indentation. Visual width is controlled by the editor, not Prettier                                                      |
| `tabWidth`                   | `2`           | Used only to calculate line length against `printWidth` — Prettier counts each tab as `2` spaces when measuring. Has no effect on how tabs render in editors |
| `printWidth`                 | `100`         | Wider than the classic 80 but avoids excessive wrapping on modern monitors                                                                                   |
| `semi`                       | `true`        | Explicit semicolons prevent subtle ASI (automatic semicolon insertion) edge cases                                                                            |
| `trailingComma`              | `"all"`       | Trailing commas everywhere valid in ES2017+ — including function parameters. Produces cleaner single-line diffs when items are added or removed              |
| `quoteProps`                 | `"as-needed"` | Only quotes object keys that require it — keeps objects readable                                                                                             |
| `bracketSpacing`             | `true`        | Spaces inside `{ }` improve readability of object literals                                                                                                   |
| `bracketSameLine`            | `false`       | JSX closing `>` on its own line — easier to spot the end of a component's props                                                                              |
| `singleAttributePerLine`     | `true`        | Each JSX attribute on its own line — improves readability and produces cleaner diffs when props change                                                       |
| `arrowParens`                | `"always"`    | Always wraps arrow function parameters — consistent and avoids extra edits when adding types                                                                 |
| `htmlWhitespaceSensitivity`  | `"strict"`    | Preserves semantically significant whitespace in HTML templates                                                                                              |
| `embeddedLanguageFormatting` | `"auto"`      | Automatically formats embedded code blocks (e.g. CSS-in-JS, GraphQL, SQL in template literals)                                                               |
| `proseWrap`                  | `"preserve"`  | Does not reflow Markdown prose — preserves intentional line breaks in documentation                                                                          |
| `endOfLine`                  | `"lf"`        | Unix line endings everywhere — avoids CRLF noise on Windows when working in cross-platform teams                                                             |

---

## Ignoring Files

Create a `.prettierignore` file in your project root to exclude paths from formatting:

```
# build output
dist/
out-tsc/
coverage/

# generated files
*.generated.ts
**/__snapshots__/**

# external configs that should not be reformatted
*.min.js
```

---

## Editor Integration

### VS Code

Install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), then add to your `.vscode/settings.json`:

```json
{
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"editor.formatOnSave": true
}
```

### Other editors

Prettier has official integrations for WebStorm, Vim, Neovim, Emacs, and more. See the [Prettier Editor Integration docs](https://prettier.io/docs/editors).

---

## License

MIT
