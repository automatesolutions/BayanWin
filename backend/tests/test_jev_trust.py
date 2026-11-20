from datetime import date

from jev.trust import HOLD, NOOP, PUBLISH, decide, group_by_draw
from jev.validate import Candidate

D = date(2026, 10, 27)
A = (1, 2, 3, 4, 5, 6)
B = (7, 8, 9, 10, 11, 12)


def c(nums, source="sheet", day=D):
    return Candidate("ultra_lotto_6_58", day, nums, None, 0, source)


def test_new_sheet_draw_publishes():
    d = decide([c(A)], [])
    assert d.action == PUBLISH and d.verified and d.candidate.numbers == A and d.alert is None


def test_already_published_same_numbers_is_noop():
    assert decide([c(A)], [A]).action == NOOP


def test_sheet_differs_from_published_is_held_never_overwritten():
    d = decide([c(B)], [A])
    assert d.action == HOLD and d.reason == "sheet_differs_from_published" and "Not changed" in d.alert


def test_two_sheet_rows_same_draw_different_numbers_is_held():
    d = decide([c(A), c(B)], [])
    assert d.action == HOLD and d.reason == "conflict_in_sheet"


def test_database_with_two_answers_is_held():
    assert decide([c(A)], [A, B]).action == HOLD


def test_sheet_wins_over_scraper_and_flags_it():
    d = decide([c(A), c(B, "apify")], [])
    assert d.action == PUBLISH and d.candidate.source == "sheet" and "scraper says" in d.alert


def test_scraper_only_waits_for_sheet_by_default():
    d = decide([c(A, "apify")], [])
    assert d.action == HOLD and d.reason == "waiting_for_sheet"


def test_scraper_only_publishes_unverified_when_allowed():
    d = decide([c(A, "apify")], [], scraper_can_publish=True)
    assert d.action == PUBLISH and not d.verified


def test_scraper_disagreeing_with_published_keeps_published():
    d = decide([c(B, "apify")], [A])
    assert d.action == NOOP and d.alert


def test_group_by_draw():
    groups = group_by_draw([c(A), c(A, "apify"), c(B, day=date(2026, 10, 25))])
    assert sorted(len(g) for g in groups) == [1, 2]
