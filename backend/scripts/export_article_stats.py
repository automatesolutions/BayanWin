"""Export draw statistics for the frontend articles.

Reads backend/data/*.xlsx (PCSO draw history) and writes
frontend/src/data/pcso-stats.json, which the guide articles render as tables.
Re-run after the spreadsheets are updated, then rebuild the frontend.

    python backend/scripts/export_article_stats.py

Needs pandas and openpyxl.
"""
from __future__ import annotations

import json
import math
from collections import Counter
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "backend" / "data"
OUT = ROOT / "frontend" / "src" / "data" / "pcso-stats.json"

GAMES = {
    "6/42": ("Lotto 6/42", "Lotto_6_42 .xlsx", 42),
    "6/45": ("Mega Lotto 6/45", "Mega_Lotto_6_45.xlsx", 45),
    "6/49": ("Super Lotto 6/49", "Super_Lotto_6_49.xlsx", 49),
    "6/55": ("Grand Lotto 6/55", "Grand_Lotto_6_55.xlsx", 55),
    "6/58": ("Ultra Lotto 6/58", "Ultra_Lotto_6_58.xlsx", 58),
}


def parse_date(value) -> datetime:
    # Text cells are month/day/year. Cells Excel turned into dates were read
    # day-first, so their month and day are swapped.
    if isinstance(value, str):
        return datetime.strptime(value.strip(), "%m/%d/%Y")
    ts = pd.Timestamp(value)
    return datetime(ts.year, ts.day, ts.month)


def odd_split_probability(n: int, k: int) -> float:
    """Chance that exactly k of the 6 numbers are odd, for a game with n balls."""
    odd = (n + 1) // 2
    return math.comb(odd, k) * math.comb(n - odd, 6 - k) / math.comb(n, 6)


def match_distribution(pairs: list[tuple[set, set]]) -> dict:
    """How many numbers each pick shared with the draw it was compared to."""
    hits = Counter(len(a & b) for a, b in pairs)
    total = len(pairs)
    return {
        "compared": total,
        "mean": round(sum(k * v for k, v in hits.items()) / total, 3),
        "share": {str(k): round(hits.get(k, 0) / total, 3) for k in range(7)},
    }


def pick_backtests(draws: list[dict], n: int, window: int = 50) -> dict:
    """Two honest tests of "patterns": does a draw repeat the one before it more
    than chance, and do the window's hottest or coldest numbers hit more often?"""
    sets = [set(d["nums"]) for d in draws]
    repeat = match_distribution([(sets[i], sets[i - 1]) for i in range(1, len(sets))])

    hot_pairs, cold_pairs = [], []
    for i in range(window, len(sets)):
        freq = Counter(x for s in sets[i - window : i] for x in s)
        ranked = sorted(range(1, n + 1), key=lambda x: (-freq.get(x, 0), x))
        hot_pairs.append((set(ranked[:6]), sets[i]))
        cold_pairs.append((set(ranked[-6:]), sets[i]))

    # Full precision: matching 5 or 6 numbers is rarer than 1 in 10,000.
    chance = {str(k): math.comb(6, k) * math.comb(n - 6, 6 - k) / math.comb(n, 6) for k in range(7)}
    return {
        "window": window,
        "expected_mean": round(36 / n, 3),
        "chance_share": chance,
        "repeat_previous": repeat,
        "hot_six": match_distribution(hot_pairs),
        "cold_six": match_distribution(cold_pairs),
    }


def game_stats(key: str, name: str, file: str, n: int) -> dict:
    df = pd.read_excel(DATA / file).dropna(how="all")  # the 6/42 sheet has one blank row
    draws = []
    for _, row in df.iterrows():
        nums = [int(x) for x in str(row["COMBINATIONS"]).split("-")]
        if len(nums) != 6 or len(set(nums)) != 6 or not all(1 <= x <= n for x in nums):
            raise ValueError(f"{file}: bad combination {row['COMBINATIONS']}")
        draws.append(
            {
                "date": parse_date(row["DRAW DATE"]),
                "nums": nums,
                "jackpot": float(row["JACKPOT (PHP)"]),
                "winners": int(row["WINNERS"] or 0),
            }
        )
    # The sheets repeat a few draws row for row: keep one copy. Two different
    # results on one date would be a real data error, so stop on those.
    unique = {}
    for d in draws:
        seen = unique.setdefault(d["date"], d)
        if seen["nums"] != d["nums"]:
            raise ValueError(f"{file}: two different results on {d['date']:%Y-%m-%d}")
    draws = sorted(unique.values(), key=lambda d: d["date"])
    dates = [d["date"] for d in draws]

    total = len(draws)
    freq = Counter(x for d in draws for x in d["nums"])
    expected = total * 6 / n
    counts = sorted(((num, freq.get(num, 0)) for num in range(1, n + 1)), key=lambda t: (-t[1], t[0]))

    sums = sorted(sum(d["nums"]) for d in draws)
    q = lambda p: sums[min(total - 1, int(p * total))]  # noqa: E731

    odd_counts = Counter(sum(x % 2 for x in d["nums"]) for d in draws)
    jackpot_draws = [d for d in draws if d["winners"] > 0]

    return {
        "key": key,
        "name": name,
        "balls": n,
        "draws": total,
        "first": dates[0].strftime("%Y-%m-%d"),
        "last": dates[-1].strftime("%Y-%m-%d"),
        "odds": math.comb(n, 6),
        "frequency": {
            "expected": round(expected, 1),
            "most": [{"number": a, "count": b} for a, b in counts[:6]],
            "least": [{"number": a, "count": b} for a, b in counts[-6:][::-1]],
            "all": {str(a): b for a, b in sorted(counts)},
        },
        "sum": {
            "min": sums[0],
            "max": sums[-1],
            "mean": round(sum(sums) / total, 1),
            "theoretical_mean": round(6 * (n + 1) / 2, 1),
            "middle_half": [q(0.25), q(0.75)],
            "middle_90": [q(0.05), q(0.95)],
        },
        "odd_even": [
            {
                "odd": k,
                "even": 6 - k,
                "draws": odd_counts.get(k, 0),
                "share": round(odd_counts.get(k, 0) / total, 3),
                "expected_share": round(odd_split_probability(n, k), 3),
            }
            for k in range(7)
        ],
        "backtests": pick_backtests(draws, n),
        "jackpots": {
            "won": len(jackpot_draws),
            "largest_won": max((d["jackpot"] for d in jackpot_draws), default=None),
            "largest_won_date": max(jackpot_draws, key=lambda d: d["jackpot"])["date"].strftime("%Y-%m-%d")
            if jackpot_draws
            else None,
        },
    }


def main() -> None:
    games = [game_stats(k, *v) for k, v in GAMES.items()]
    out = {"source": "PCSO draw results, BayanWin dataset (backend/data)", "games": games}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    for g in games:
        print(f"{g['key']}: {g['draws']} draws, {g['first']} to {g['last']}, {g['jackpots']['won']} jackpots won")


if __name__ == "__main__":
    main()
