# WF-07 Response Validation
Validate HTTP status, API-level result, JSON shape, then data presence.
HTTP 200 does not imply API success.
0 rows -> normal empty completion.
Classify retryable errors for WF-11; otherwise fail with safe user message + detailed log.
