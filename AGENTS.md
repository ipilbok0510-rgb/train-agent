# Train Agent Instructions

## Goal
Build/operate a Windows-local Flask app that shows all daily train plans for Seoul <-> Busan using KORAIL public API.

## Context loading
1. Read `docs/index.md`.
2. Read `docs/core.md` plus only the WF files relevant to the current task.
3. Do not preload all docs or restate them in replies.

## Rules
- Keep API key only in `.env`; never log, print, commit, or expose it to HTML.
- Runtime agent may inspect, call APIs, validate, retry within policy, log, and report.
- Do not auto-change code/config/Windows/firewall, install packages, delete files, or rotate keys unless explicitly asked.
- Input errors/auth errors: no retry. Transient API errors: follow `docs/core.md`.
- Pagination and retry are separate concerns.

## Completion
Run relevant checks, verify `/health`, report changed files + test result + unresolved issue only.
