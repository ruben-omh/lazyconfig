---
"@lazyconfig/cli": patch
---

Fix `hook commit-signoff` silently dropping the sign-off under `git commit -v`.

The trailer was appended to the end of the commit message file. Under `git commit -v` — and for anyone with `commit.verbose=true` configured — git places a scissors line and the diff below the message and discards everything from the scissors down, taking the appended trailer with it. The result was a commit with no `Signed-off-by` and no warning, which any DCO check then rejects.

The trailer is now added with `git interpret-trailers --in-place`, which writes into the message's trailer block ahead of the comment and scissors sections. Repeat runs stay idempotent via `--if-exists addIfDifferent`, and a sign-off already present from a different author is preserved.
