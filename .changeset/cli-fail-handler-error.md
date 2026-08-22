---
"@lazyconfig/cli": patch
---

Report the real error when a command fails asynchronously.

The yargs `fail` handler read only its first argument. Yargs passes `(msg, err)`, and for a rejected async command handler it passes `msg === null` with the error in `err` — so every async failure printed `ERROR null` and exited 1 with nothing else. Since each package's build runs `lazyconfig compile types`, a broken build surfaced with no diagnostic at all.

The handler now falls back to `err`, so the underlying message and stack reach the terminal. Validation failures are unaffected.
