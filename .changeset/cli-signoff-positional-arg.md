---
"@lazyconfig/cli": minor
---

**Breaking:** `hook commit-signoff` no longer accepts a positional argument.

The command was declared as `commit-signoff [options]`, which yargs read as a real optional positional named `options` rather than a usage placeholder. That made `lazyconfig hook commit-signoff "$1"` parse cleanly, exit 0, and sign `$GIT_DIR/COMMIT_EDITMSG` instead of the file git actually passed — the wrong file in a worktree, and silently so. `.strict()` could not catch it because the positional was declared.

The placeholder is gone, so that form is now rejected with a clear error. Pass the message file with the flag instead:

```sh
# .husky/prepare-commit-msg
lazyconfig hook commit-signoff -f "$1"
```
