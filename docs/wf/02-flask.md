# WF-02 Flask Start
Start Flask on `127.0.0.1:5000`; expose `GET /health`.
Success: health returns 200 + `{"status":"ok"}`.
Port/startup failure: log cause, stop; no infinite restart loop.
