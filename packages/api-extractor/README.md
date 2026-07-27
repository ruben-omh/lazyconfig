# @lazyconfig/api-extractor

[![npm](https://img.shields.io/npm/v/@lazyconfig/api-extractor?style=flat-square&logo=npm&logoColor=white&color=FFCA28)](https://www.npmjs.com/package/@lazyconfig/api-extractor)
[![Downloads](https://img.shields.io/npm/dm/@lazyconfig/api-extractor?style=flat-square&logo=npm&logoColor=white&label=downloads&color=8957E5)](https://www.npmjs.com/package/@lazyconfig/api-extractor)
[![License](https://img.shields.io/npm/l/@lazyconfig/api-extractor?style=flat-square&color=blue)](LICENSE)
[![Sponsor](https://img.shields.io/github/sponsors/ruben-omh?style=flat-square&logo=githubsponsors&logoColor=white&color=EA4AAA&label=Sponsor)](https://github.com/sponsors/ruben-omh)

Shared API Extractor base configuration for generating rolled-up `.d.ts` declaration files.

---

## Installation

```sh
npm install --save-dev @lazyconfig/api-extractor @microsoft/api-extractor
```

---

## Usage

Create an `api-extractor.json` in your package and extend the base config:

```json
{
	"$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
	"extends": "@lazyconfig/api-extractor/base.json",
	"projectFolder": ".",
	"mainEntryPointFilePath": "<projectFolder>/out-tsc/index.d.ts",
	"dtsRollup": {
		"enabled": true,
		"untrimmedFilePath": "<projectFolder>/dist/<unscopedPackageName>.index.d.ts",
		"alphaTrimmedFilePath": "",
		"betaTrimmedFilePath": "",
		"publicTrimmedFilePath": ""
	}
}
```

---

## Base configuration

The base config sets the following defaults:

| Setting                     | Value                                         | Description                                       |
| --------------------------- | --------------------------------------------- | ------------------------------------------------- |
| `newlineKind`               | `lf`                                          | Consistent line endings across platforms.         |
| `enumMemberOrder`           | `preserve`                                    | Keeps enum member order as declared in source.    |
| `compiler.overrideTsconfig` | `moduleResolution: Bundler`, `target: ES2022` | Aligns with modern bundler output.                |
| `apiReport`                 | disabled                                      | API report file generation is off by default.     |
| `docModel`                  | disabled                                      | Doc model generation is off by default.           |
| `dtsRollup`                 | enabled                                       | Produces a single rolled-up `.d.ts` file.         |
| `tsdocMetadata`             | disabled                                      | TSDoc metadata file generation is off by default. |
| `ae-missing-release-tag`    | suppressed                                    | Release tag annotations are not required.         |
| `ae-undocumented`           | suppressed                                    | Undocumented public members do not raise errors.  |

---

## License

MIT
