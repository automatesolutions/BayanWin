"""Pick which source to trust for one draw. Conflicts are held and flagged, never auto-resolved."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence, Tuple

from jev.validate import Candidate

PUBLISH, HOLD, NOOP = "publish", "hold", "noop"


@dataclass(frozen=True)
class Decision:
    action: str  # publish | hold | noop
    reason: str
    candidate: Optional[Candidate] = None
    verified: bool = True  # False only for a scraper-only publish
    alert: Optional[str] = None  # set when you should look at this draw


def _fmt(nums: Iterable[int]) -> str:
    return "-".join(f"{n:02d}" for n in nums)


def decide(
    candidates: Sequence[Candidate],
    published: Sequence[Tuple[int, ...]],
    *,
    scraper_can_publish: bool = False,
) -> Decision:
    """
    `candidates`: valid rows for ONE game and ONE draw date, from any source.
    `published`: number tuples already in the database for that game and date.

    Rules, in order:
    1. Two Sheet rows for the same draw with different numbers: hold.
    2. Already published:
       - same numbers as the Sheet: nothing to do;
       - the Sheet differs: hold and alert (published numbers never change on their own);
       - only a scraper differs: keep the published numbers and alert.
    3. Not published yet:
       - the Sheet has it: publish the Sheet row (alert if a scraper disagrees);
       - only a scraper has it: publish as unverified if allowed, else hold for the Sheet.
    """
    if not candidates:
        return Decision(NOOP, "no valid candidates")
    game, day = candidates[0].game_type, candidates[0].draw_date.isoformat()
    sheet = [c for c in candidates if c.source == "sheet"]
    scraper = [c for c in candidates if c.source != "sheet"]

    sheet_sets = {c.numbers for c in sheet}
    if len(sheet_sets) > 1:
        shown = ", ".join(_fmt(s) for s in sorted(sheet_sets))
        return Decision(HOLD, "conflict_in_sheet", alert=f"{game} {day}: the Sheet has two rows with different numbers ({shown})")

    published_sets = set(published)
    if len(published_sets) > 1:
        shown = ", ".join(_fmt(s) for s in sorted(published_sets))
        return Decision(HOLD, "conflict_in_database", alert=f"{game} {day}: the database has different numbers for one draw ({shown})")

    if published_sets:
        current = next(iter(published_sets))
        if sheet and sheet[0].numbers != current:
            return Decision(
                HOLD,
                "sheet_differs_from_published",
                candidate=sheet[0],
                alert=f"{game} {day}: Sheet says {_fmt(sheet[0].numbers)} but {_fmt(current)} is published. Not changed; check and correct it.",
            )
        odd = [c for c in scraper if c.numbers != current]
        if odd:
            return Decision(NOOP, "scraper_differs_from_published",
                            alert=f"{game} {day}: scraper says {_fmt(odd[0].numbers)}, published {_fmt(current)} kept.")
        return Decision(NOOP, "already_published")

    if sheet:
        odd = [c for c in scraper if c.numbers != sheet[0].numbers]
        alert = f"{game} {day}: scraper says {_fmt(odd[0].numbers)}, Sheet {_fmt(sheet[0].numbers)} published." if odd else None
        return Decision(PUBLISH, "sheet_new_draw", candidate=sheet[0], alert=alert)

    scraper_sets = {c.numbers for c in scraper}
    if len(scraper_sets) > 1:
        return Decision(HOLD, "conflict_between_scrapers", alert=f"{game} {day}: scrapers disagree; waiting for the Sheet.")
    if scraper_can_publish:
        return Decision(PUBLISH, "scraper_only_unverified", candidate=scraper[0], verified=False,
                        alert=f"{game} {day}: published from a scraper as unverified. Add it to the Sheet to confirm.")
    return Decision(HOLD, "waiting_for_sheet", candidate=scraper[0],
                    alert=f"{game} {day}: scraper has {_fmt(scraper[0].numbers)}, the Sheet doesn't yet. Add it to the Sheet.")


def group_by_draw(candidates: Iterable[Candidate]) -> List[List[Candidate]]:
    groups = {}
    for c in candidates:
        groups.setdefault((c.game_type, c.draw_date), []).append(c)
    return list(groups.values())
