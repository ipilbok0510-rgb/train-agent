# WF-11 Retry/Recovery
No retry: validation, auth, JSON parse errors.
Retry max 3: timeout, 429, 500, 502, 503, 504 using backoff in `core.md`.
State: `ERROR -> RETRYING -> REQUESTING`; success continues; exhausted retries -> `FAILED`.
Never repair by changing key/code/OS settings.
