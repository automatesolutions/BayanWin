"""
Remove duplicate lotto result rows from InstantDB (approved 2026-10-28).

A duplicate is a second row with the same game, draw date and numbers. For each draw the
oldest row is kept. Prediction and accuracy records that point at a removed copy are
repointed to the kept row first, so no score is orphaned. Nothing else changes.

    python scripts/maintenance/dedupe_results.py            # dry run: backup + plan, no writes
    python scripts/maintenance/dedupe_results.py --apply    # backup, then repoint and delete

Run from the backend folder. Backups go to ../backups/instantdb-<timestamp>/.
To undo, re-insert the rows listed in delete_plan.json from the backup *_results.json files.
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import sys
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from config import Config  # noqa: E402
from jev.store import Store, StoreError, numbers_of  # noqa: E402

BATCH = 100


def plan_game(results, predictions, accuracy):
    groups = collections.defaultdict(list)
    for r in results:
        groups[(str(r.get("draw_date") or "")[:10], numbers_of(r))].append(r)
    keep_for = {}
    for rows in groups.values():
        rows.sort(key=lambda r: (r.get("created_at") or "", r["id"]))
        for r in rows:
            keep_for[r["id"]] = rows[0]["id"]
    delete = [rid for rid, kept in keep_for.items() if rid != kept]
    repoint_acc = [(a["id"], keep_for[a["result_id"]]) for a in accuracy
                   if a.get("result_id") in keep_for and keep_for[a["result_id"]] != a["result_id"]]
    repoint_pred = [(p["id"], keep_for[p["result_id"]]) for p in predictions
                    if p.get("result_id") in keep_for and keep_for[p["result_id"]] != p["result_id"]]
    return {"unique_draws": len(groups), "delete": delete, "repoint_accuracy": repoint_acc, "repoint_predictions": repoint_pred}


def transact_with_retry(store: Store, steps):
    for attempt in range(3):
        try:
            store.transact(steps)
            return
        except StoreError:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="write changes (default is a dry run)")
    args = ap.parse_args()

    store = Store(Config.INSTANTDB_APP_ID or "", Config.INSTANTDB_ADMIN_TOKEN or "", timeout=120)
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "backups",
                                           "instantdb-" + datetime.now().strftime("%Y%m%d-%H%M%S")))
    os.makedirs(out_dir, exist_ok=True)

    plans = {}
    for game in Config.GOOGLE_SHEETS:
        tables = {}
        for kind in ("results", "predictions", "prediction_accuracy"):
            entity = f"{game}_{kind}"
            tables[kind] = store.query({entity: {}}).get(entity, [])
            with open(os.path.join(out_dir, f"{entity}.json"), "w", encoding="utf-8") as f:
                json.dump(tables[kind], f)
        p = plan_game(tables["results"], tables["predictions"], tables["prediction_accuracy"])
        plans[game] = p
        print(f"{game:18} rows {len(tables['results']):5}  unique draws {p['unique_draws']:5}  "
              f"delete {len(p['delete']):5}  repoint {len(p['repoint_accuracy'])} accuracy + {len(p['repoint_predictions'])} predictions")

    with open(os.path.join(out_dir, "delete_plan.json"), "w", encoding="utf-8") as f:
        json.dump(plans, f)
    print(f"\nBackup and plan: {out_dir}")

    if not args.apply:
        print("Dry run: nothing changed. Re-run with --apply to clean up.")
        return 0

    for game, p in plans.items():
        steps = [["update", f"{game}_prediction_accuracy", aid, {"result_id": kept}] for aid, kept in p["repoint_accuracy"]]
        steps += [["update", f"{game}_predictions", pid, {"result_id": kept}] for pid, kept in p["repoint_predictions"]]
        steps += [["delete", f"{game}_results", rid] for rid in p["delete"]]
        for i in range(0, len(steps), BATCH):
            transact_with_retry(store, steps[i:i + BATCH])
        left = store.query({f"{game}_results": {}}).get(f"{game}_results", [])
        print(f"{game:18} done. Rows now {len(left)} (expected {p['unique_draws']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
