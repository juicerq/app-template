# Personal Desktop App Template

## Problem Statement

Starting a personal desktop app requires re-deciding too many fundamentals (stack, persistence, distribution, updates) every time, which delays or prevents the actual project work.

## Solution

A reusable template that encodes the baseline decisions needed to ship a personal CRUD productivity desktop app, so each fork starts with persistence, observability, distribution, and updates already wired up.

## User Stories

1. [ ] As jui, I want to fork a single template to start any new personal CRUD productivity desktop app, so that I do not re-decide fundamentals each time.
2. [ ] As jui, I want my apps to run on Linux and Windows, so that I cover the platforms I use.
3. [ ] As jui, I want my apps to persist their data locally without requiring a server, so that they work offline.
4. [ ] As jui, I want my apps to remember user preferences across launches, so that the experience persists.
5. [ ] As jui, I want my apps to record observability events locally, so that I can debug issues after they happen.
6. [ ] As jui, I want my apps to update automatically from a public source, so that I never have to manually re-distribute.
7. [ ] As jui, I want internal communication within an app to be type-checked, so that refactors do not silently break.
8. [ ] As jui, I want my apps to ship as installable binaries for Linux and Windows, so that distribution is one step per platform.
9. [ ] As jui, I want the template's testing setup to exercise real persistence rather than mocks of internal code, so that tests reflect production behavior.
10. [ ] As jui, I want the template to ship only the decisions needed for CRUD productivity apps, so that forks do not carry abstractions they will not use.

## Out of Scope

- macOS support.
- App categories beyond CRUD productivity (editor-class apps, media apps, communication apps, etc.).
- Multi-app structure within a single fork.
- Pre-installed end-to-end UI testing infrastructure.
- Pre-installed component testing infrastructure.
- Code signing of distributed binaries.

## Further Notes
