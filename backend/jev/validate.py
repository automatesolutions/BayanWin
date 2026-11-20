"""Parse and validate one result row. Plain code, no I/O, no model: Jev never changes official numbers."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple

# Accepted Sheet date formats. Day-first is not accepted: "03/04/2026" must mean March 4.
DATE_FORMATS = ("%m/%d/%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S")
SHEETS_EPOCH = date(1899, 12, 30)  # date serials from unformatted Sheets reads


@dataclass(frozen=True)
class Candidate:
    """One result as a source reported it, before any decision."""
    game_type: str
    draw_date: date
    numbers: Tuple[int, ...]  # sorted, as stored in the database
    jackpot: Optional[float]
    winners: Optional[int]
    source: str  # "sheet" or "scraper"
    source_ref: str = ""  # e.g. "Sheet1!row 1648"

    @property
    def key(self) -> str:
        return f"{self.draw_date.isoformat()}|{'-'.join(f'{n:02d}' for n in self.numbers)}"

    def to_db_row(self) -> Dict[str, Any]:
        """Same shape the Sheets scraper has always written."""
        n = self.numbers
        return {
            "draw_date": datetime(self.draw_date.year, self.draw_date.month, self.draw_date.day).isoformat(),
            "draw_number": "-".join(f"{x:02d}" for x in n),
            **{f"number_{i + 1}": n[i] for i in range(6)},
            "jackpot": self.jackpot,
            "winners": self.winners if self.winners is not None else 0,
        }


@dataclass(frozen=True)
class Rejected:
    game_type: str
    reasons: Tuple[str, ...]
    raw: Dict[str, Any] = field(default_factory=dict)
    source: str = "sheet"
    source_ref: str = ""
    hold: bool = False  # True: valid-looking but needs your OK (e.g. off-schedule date)


def _norm_name(s: str) -> str:
    return "".join(str(s).lower().split())


def parse_date(value: Any) -> Optional[date]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        from datetime import timedelta

        return SHEETS_EPOCH + timedelta(days=int(value))
    s = str(value).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def parse_numbers(value: Any) -> Tuple[Optional[List[int]], Optional[str]]:
    s = str(value or "").strip()
    if not s:
        return None, "combination is empty"
    parts = [p.strip() for p in s.replace(" ", "").split("-")]
    if not all(p.isdigit() for p in parts):
        return None, f"combination '{s}' has a part that is not a whole number"
    return [int(p) for p in parts], None


def parse_money(value: Any) -> Tuple[Optional[float], Optional[str]]:
    if value is None or str(value).strip() == "":
        return None, None
    try:
        return float(str(value).replace(",", "").replace("₱", "").strip()), None
    except ValueError:
        return None, f"jackpot '{value}' is not a number"


def parse_count(value: Any) -> Tuple[Optional[int], Optional[str]]:
    if value is None or str(value).strip() == "":
        return 0, None
    try:
        f = float(str(value).replace(",", "").strip())
    except ValueError:
        return None, f"winners '{value}' is not a number"
    if f != int(f):
        return None, f"winners '{value}' is not a whole number"
    return int(f), None


def column_map(header: Sequence[Any]) -> Dict[str, int]:
    """Find the five columns by their header text (the Sheets use these exact labels)."""
    want = {
        "game": ("LOTTO GAME", "LOTTOGAME"),
        "combination": ("COMBINATIONS",),
        "date": ("DRAW DATE",),
        "jackpot": ("JACKPOT (PHP)", "JACKPOT"),
        "winners": ("WINNERS",),
    }
    found: Dict[str, int] = {}
    for i, h in enumerate(header):
        label = str(h).strip().upper()
        for key, names in want.items():
            if label in names and key not in found:
                found[key] = i
    missing = [k for k in ("combination", "date") if k not in found]
    if missing:
        raise ValueError(f"Sheet header is missing column(s): {', '.join(missing)} (header: {list(header)})")
    return found


def validate_row(
    game_type: str,
    game_rules: Dict[str, Any],
    cols: Dict[str, int],
    cells: Sequence[Any],
    *,
    today: date,
    draw_days: Sequence[int],
    no_draw_dates: frozenset = frozenset(),
    hold_off_schedule: bool = True,
    source: str = "sheet",
    source_ref: str = "",
) -> Optional[Candidate | Rejected]:
    """
    Turn one Sheet row into a Candidate, or a Rejected with every reason found.
    Returns None for a blank row. `game_rules` is Config.GAMES[game_type].
    """
    def cell(key: str) -> Any:
        i = cols.get(key)
        return cells[i] if i is not None and i < len(cells) else None

    raw = {k: cell(k) for k in ("game", "combination", "date", "jackpot", "winners")}
    # Blank, or still being typed (no combination or no date yet): skip quietly. If the draw
    # never gets finished, the missing-result alert covers it.
    if any(raw[k] is None or str(raw[k]).strip() == "" for k in ("combination", "date")):
        return None

    reasons: List[str] = []
    hold = False

    if "game" in cols and raw["game"] not in (None, ""):
        expected = _norm_name(game_rules["name"])
        got = _norm_name(raw["game"])
        if expected not in got and got not in expected:
            reasons.append(f"game '{raw['game']}' doesn't match {game_rules['name']}")

    numbers, err = parse_numbers(raw["combination"])
    if err:
        reasons.append(err)
    else:
        need = int(game_rules.get("numbers_count", 6))
        lo, hi = int(game_rules["min_number"]), int(game_rules["max_number"])
        if len(numbers) != need:
            reasons.append(f"has {len(numbers)} numbers, needs {need}")
        if len(set(numbers)) != len(numbers):
            reasons.append("has a repeated number")
        out = [n for n in numbers if not lo <= n <= hi]
        if out:
            reasons.append(f"number(s) {out} outside {lo}-{hi}")

    d = parse_date(raw["date"])
    if d is None:
        reasons.append(f"draw date '{raw['date']}' is not a valid MM/DD/YYYY date")
    elif d > today:
        reasons.append(f"draw date {d.isoformat()} is in the future")

    jackpot, err = parse_money(raw["jackpot"])
    if err:
        reasons.append(err)
    elif jackpot is not None and jackpot < 0:
        reasons.append("jackpot is negative")
    winners, err = parse_count(raw["winners"])
    if err:
        reasons.append(err)
    elif winners is not None and winners < 0:
        reasons.append("winners is negative")

    if not reasons and d is not None:
        if d in no_draw_dates:
            reasons.append(f"{d.isoformat()} is listed as a no-draw date")
            hold = True
        elif d.weekday() not in draw_days and hold_off_schedule:
            reasons.append(f"{d.strftime('%A')} {d.isoformat()} is not a draw day for this game")
            hold = True

    if reasons:
        return Rejected(game_type, tuple(reasons), raw, source, source_ref, hold)
    return Candidate(game_type, d, tuple(sorted(numbers)), jackpot, winners, source, source_ref)
