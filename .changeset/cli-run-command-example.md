---
"@lazyconfig/cli": patch
---

Show the remediation command when a git invocation fails.

Failures could carry an `example` — a copy-pasteable command that fixes the cause, such as `git config user.name "Your Name"` when the sign-off hook finds no configured author. Its value was never rendered. All it did was gate a different, generic line, and that line went through `logger.info`, which is a no-op unless `watch` is enabled — the opposite of the default that git hooks run under. The hint therefore never reached anyone.

The example is now printed on the error channel alongside the message, so it appears on the default silent path where it is actually needed.
