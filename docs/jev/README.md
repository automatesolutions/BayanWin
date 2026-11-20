# Jev

Jev is BayanWin's decision and routing layer. It gets each new lotto result from the Google Sheet to the site in seconds, checks every row before it's shown, and sends model work to the cheapest option that can do it. Official numbers never wait on a model, and Jev never changes or invents them.

All rules live in [`backend/jev/jev.toml`](../../backend/jev/jev.toml). Edit that file and redeploy; the backend refuses to start if the file is invalid.

## How a result gets published

1. You type the draw into the game's Sheet.
2. The Apps Script ([`sheet-push.gs`](sheet-push.gs)) calls `POST /api/jev/sheet-edited` when the row is complete. As a safety net, Cloud Scheduler calls `POST /api/jev/tick` every minute, and Jev syncs a game every 60 s for 3 hours after its draw time, and every 10 minutes otherwise.
3. Jev reads the last 40 rows of the Sheet (one Sheets API call) and checks each one: right game, 6 different numbers in range, a valid past date on a draw day.
4. Jev compares each row with the database ([`trust.py`](../../backend/jev/trust.py)):
   - New draw: publish it.
   - Same numbers already published: nothing to do.
   - Different numbers from what's published: hold it and alert you. Published numbers never change on their own.
5. Publishing writes the row, clears the results cache, and tells open pages over `GET /api/results/stream`. Pages refetch within about a second.
6. Accuracy, DRL learning and stats refresh run afterwards in a background queue, once per draw.

Results from a scraper (Apify) only cross-check the Sheet and raise alerts, unless you set `scraper_can_publish = true`.

## Alerts (Cloud Logging)

Every alert is a log line with `jsonPayload.jev="alert"` and severity ERROR:

| Kind | Meaning |
|---|---|
| `missing_result` | A draw has no result 120 minutes after draw time |
| `invalid_row` | A Sheet row failed a check. It was not published |
| `held` | A row is valid but dated on a non-draw day or holiday. It needs your OK |
| `conflict` | The Sheet disagrees with what's published, or has two answers for one draw |
| `sync_failing` | 3 failed syncs in a row. The site keeps showing the last good data |
| `quota` | The Sheets API returned 429 |

The same alert repeats at most once an hour.

Every decision (sync, publish, hold, model route, background job) is logged with `jsonPayload.jev="decision"`, including the option chosen, the reason, the latency and the cost.

## Model routing

Each task in `[routes]` has a chain: the first handler, then fallbacks. Example: `miro_pick` is `llm:large → llm:small → code:vote → cached`. Every step has a timeout. A route skips models once its daily cost cap is reached, and the last step is "Analysis coming soon", never an invented answer. Validation and parsing never use a model.

## Endpoints

| Endpoint | Auth header | Purpose |
|---|---|---|
| `POST /api/jev/tick` | `X-Scrape-Cron-Secret` | Cloud Scheduler, every minute |
| `POST /api/jev/sheet-edited` | `X-Jev-Sheet-Secret` | Apps Script push |
| `GET /api/results/stream` | none | Live updates for open pages |
| `GET /api/jev/status` | `X-Jev-Admin-Secret` | Per game: latest draw, overdue draws, last sync, sync success rate, cache hit rate, quota errors, publish latency, jobs, alerts |
| `GET /api/jev/summary` | `X-Jev-Admin-Secret` | Per route: calls, outcomes, p50/p95 latency, cost; plus recent decisions |

## Setup (one time)

1. **Database index.** From `lof-v2-db`, run `npx instant-cli login`, then `npx instant-cli push schema`. Read the plan it prints: it should only add an index on `draw_date` for the 5 results tables. Then confirm.
2. **Remove duplicate results.** From `backend`, run `python scripts/maintenance/dedupe_results.py` (a dry run). Check the counts, then run it again with `--apply`. It backs everything up to `backups/` first.
3. **Cloud Run env vars** on the backend:
   - `CRON_SCRAPE_SECRET`: a long random value, used by the scheduler.
   - `JEV_SHEET_SECRET`: a long random value, used by the Apps Script.
   - `JEV_ADMIN_SECRET`: a long random value, for the status and summary endpoints.
   - `JEV_SMALL_MODEL` (optional): a cheaper model name for fallbacks. Leave unset to skip that step.
4. **Cloud Scheduler.** One job, free tier:
   ```
   gcloud scheduler jobs create http jev-tick --location=asia-southeast1 --schedule="* * * * *" \
     --uri="https://YOUR-BACKEND-URL/api/jev/tick" --http-method=POST \
     --headers="X-Scrape-Cron-Secret=YOUR_CRON_SECRET" --attempt-deadline=120s
   ```
   If the old `lof-sheets-cron` job exists, delete it.
5. **Apps Script.** Install [`sheet-push.gs`](sheet-push.gs) in each of the 5 Sheets (steps are at the top of the file).
6. **Email alerts.** In Cloud Logging, create a log-based alert with the filter `jsonPayload.jev="alert"` and an email notification channel.

## Tests

From `backend`: `pip install -r requirements-dev.txt`, then `python -m pytest tests`.
