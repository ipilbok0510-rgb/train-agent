# WF-01 Precheck
Purpose: fail fast before serving requests.
Check: Python/runtime deps, `.env`, `API_KEY`, log path.
If key/dependency missing: stop and report; do not auto-install or retry.
Output: `READY` or terminal configuration error.
