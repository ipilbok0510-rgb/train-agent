# Core Contract

- OS: Windows; local dev first.
- Stack: Python + Flask + requests + python-dotenv.
- API base: `https://apis.data.go.kr/B551457/run/v2`
- Plan path: `/travelerTrainRunPlan2`
- Stations: Seoul=`3900023`, Busan=`3900114`.
- Date input `YYYY-MM-DD` -> API `YYYYMMDD`; one-day query uses same GTE/LTE date.
- Output: train no, dep station/time, arr station/time; sort by departure time.
- 0 rows = successful empty result.
- Timeout target: 10s.
- Retry max: 3 for timeout/429/500/502/503/504; never retry input/auth/parse errors.
- Suggested backoff: 2s, 5s, then fail.
- States: `INIT -> READY -> VALIDATING -> REQUESTING -> PROCESSING -> COMPLETED`; transient failure uses `RETRYING`; terminal failure=`FAILED`.
- Health: `GET /health` -> `{"status":"ok"}`.
- Logs: `logs/app.log`; never include API key.
